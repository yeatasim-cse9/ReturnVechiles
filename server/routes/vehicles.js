const express = require("express");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

const router = express.Router();

// Get all vehicles with search and filters
router.get("/", async (req, res) => {
  try {
    const searchParams = {
      type: req.query.type,
      city: req.query.city,
      area: req.query.area,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      capacity: req.query.capacity ? Number(req.query.capacity) : undefined,
      features: req.query.features ? req.query.features.split(",") : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder ? Number(req.query.sortOrder) : -1,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };

    console.log("Vehicle search params:", searchParams);

    const vehicles = await Vehicle.searchVehicles(searchParams);
    const totalCount = await Vehicle.countDocuments({
      "availability.isActive": true,
      "availability.isAvailable": true,
      status: "approved",
    });

    res.status(200).json({
      message: "Vehicles fetched successfully",
      vehicles,
      pagination: {
        currentPage: searchParams.page,
        totalPages: Math.ceil(totalCount / searchParams.limit),
        totalCount,
        hasNext: searchParams.page < Math.ceil(totalCount / searchParams.limit),
        hasPrev: searchParams.page > 1,
      },
    });
  } catch (error) {
    console.error("Get vehicles error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get vehicle by ID
router.get("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "driver",
      "name email phone rating.average rating.count profileImage"
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({
      message: "Vehicle found",
      vehicle,
    });
  } catch (error) {
    console.error("Get vehicle error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get vehicles by driver
router.get("/driver/:driverId", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ driver: req.params.driverId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Driver vehicles fetched successfully",
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error("Get driver vehicles error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new vehicle (for drivers)
router.post("/", async (req, res) => {
  try {
    const vehicleData = req.body;

    // Validate required fields
    const requiredFields = [
      "driver",
      "type",
      "brand",
      "model",
      "year",
      "plateNumber",
      "color",
    ];
    const missingFields = requiredFields.filter((field) => !vehicleData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    // Check if driver exists and is a driver
    const driver = await User.findById(vehicleData.driver);
    if (!driver || driver.role !== "driver") {
      return res.status(400).json({
        message: "Invalid driver or user is not a driver",
      });
    }

    // Check if plate number already exists
    const existingVehicle = await Vehicle.findOne({
      plateNumber: vehicleData.plateNumber.toUpperCase(),
    });
    if (existingVehicle) {
      return res.status(400).json({
        message: "Vehicle with this plate number already exists",
      });
    }

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    await vehicle.populate("driver", "name email phone");

    console.log("New vehicle created:", vehicle.plateNumber);

    res.status(201).json({
      message: "Vehicle created successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Create vehicle error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Vehicle with this plate number already exists",
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update vehicle
router.put("/:id", async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const vehicle = await Vehicle.findByIdAndUpdate(vehicleId, updateData, {
      new: true,
      runValidators: true,
    }).populate("driver", "name email phone");

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Update vehicle error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete vehicle
router.delete("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get vehicle types and cities for filters
router.get("/meta/filters", async (req, res) => {
  try {
    const vehicleTypes = await Vehicle.distinct("type", {
      "availability.isActive": true,
      status: "approved",
    });

    const cities = await Vehicle.distinct("location.city", {
      "availability.isActive": true,
      status: "approved",
    });

    const features = await Vehicle.distinct("features");

    const priceRange = await Vehicle.aggregate([
      {
        $match: {
          "availability.isActive": true,
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$pricing.pricePerKm" },
          maxPrice: { $max: "$pricing.pricePerKm" },
        },
      },
    ]);

    res.status(200).json({
      message: "Filter options fetched successfully",
      filters: {
        vehicleTypes: vehicleTypes.sort(),
        cities: cities.sort(),
        features: features.sort(),
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 100 },
      },
    });
  } catch (error) {
    console.error("Get filters error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Calculate price for a trip
router.post("/calculate-price", async (req, res) => {
  try {
    const { vehicleId, distance, duration } = req.body;

    if (!vehicleId || !distance || !duration) {
      return res.status(400).json({
        message: "Vehicle ID, distance, and duration are required",
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const price = vehicle.calculatePrice(distance, duration);

    res.status(200).json({
      message: "Price calculated successfully",
      pricing: {
        vehicleId: vehicle._id,
        basePrice: vehicle.pricing.basePrice,
        pricePerKm: vehicle.pricing.pricePerKm,
        pricePerHour: vehicle.pricing.pricePerHour,
        minimumFare: vehicle.pricing.minimumFare,
        distance,
        duration,
        calculatedPrice: price,
        currency: vehicle.pricing.currency,
      },
    });
  } catch (error) {
    console.error("Calculate price error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
