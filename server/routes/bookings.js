const express = require("express");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

const router = express.Router();

// Test route for debugging
router.get("/test", async (req, res) => {
  try {
    console.log("📊 Booking test route hit");
    res.status(200).json({
      message: "Booking API is working perfectly!",
      timestamp: new Date().toISOString(),
      routes: {
        test: "/api/bookings/test",
        userBookings: "/api/bookings/user/:userId",
        driverBookings: "/api/bookings/driver/:driverId",
        createBooking: "POST /api/bookings",
        calculatePrice: "POST /api/bookings/calculate-price",
      },
    });
  } catch (error) {
    console.error("❌ Test route error:", error);
    res.status(500).json({
      message: "Test route failed",
      error: error.message,
    });
  }
});

// Database test route
router.get("/db-test", async (req, res) => {
  try {
    console.log("🧪 Testing Booking model...");

    // Test if we can count bookings
    const count = await Booking.countDocuments();
    console.log("📊 Total bookings in database:", count);

    res.status(200).json({
      message: "Database test successful",
      bookingCount: count,
      modelTest: "Booking model working",
      collections: "Bookings collection accessible",
    });
  } catch (error) {
    console.error("❌ Database test error:", error);
    res.status(500).json({
      message: "Database test failed",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Create new booking
router.post("/", async (req, res) => {
  try {
    const {
      vehicleId,
      userId,
      pickupLocation,
      dropoffLocation,
      distance,
      estimatedDuration,
      scheduledDateTime,
      specialRequests,
      paymentMethod,
    } = req.body;

    console.log("📅 Creating new booking:", {
      vehicleId,
      userId,
      distance,
      estimatedDuration,
    });

    // Validation
    if (
      !vehicleId ||
      !userId ||
      !pickupLocation ||
      !dropoffLocation ||
      !distance ||
      !estimatedDuration ||
      !scheduledDateTime
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        required: [
          "vehicleId",
          "userId",
          "pickupLocation",
          "dropoffLocation",
          "distance",
          "estimatedDuration",
          "scheduledDateTime",
        ],
      });
    }

    // Get vehicle and driver info
    const vehicle = await Vehicle.findById(vehicleId).populate("driver");
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (!vehicle.availability.isActive || !vehicle.availability.isAvailable) {
      return res
        .status(400)
        .json({ message: "Vehicle is not available for booking" });
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if vehicle is available at scheduled time
    const scheduledDate = new Date(scheduledDateTime);
    const existingBookings = await Booking.find({
      vehicle: vehicleId,
      scheduledDateTime: {
        $gte: new Date(scheduledDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
        $lte: new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours after
      },
      status: { $in: ["confirmed", "started"] },
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({
        message: "Vehicle is already booked for the selected time slot",
        suggestedTimes: [],
      });
    }

    // Create booking object
    const booking = new Booking({
      user: userId,
      driver: vehicle.driver._id,
      vehicle: vehicleId,
      tripDetails: {
        pickupLocation,
        dropoffLocation,
        distance,
        estimatedDuration,
      },
      scheduledDateTime,
      specialRequests,
      payment: {
        method: paymentMethod || "cash",
      },
    });

    // Calculate pricing
    const pricing = booking.calculatePrice(vehicle);
    booking.pricing = pricing;

    // Save booking
    await booking.save();

    // Populate the booking for response
    await booking.populate([
      { path: "user", select: "name email phone" },
      { path: "driver", select: "name email phone" },
      { path: "vehicle", select: "brand model plateNumber type pricing" },
    ]);

    console.log("✅ Booking created successfully:", booking._id);

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Create booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all bookings (admin)
router.get("/", async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate("user", "name email phone")
      .populate("driver", "name email phone rating.average")
      .populate("vehicle", "brand model plateNumber type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Booking.countDocuments(query);

    res.status(200).json({
      message: "Bookings fetched successfully",
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Get bookings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get booking by ID
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("driver", "name email phone rating.average")
      .populate("vehicle", "brand model plateNumber type pricing");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking found",
      booking,
    });
  } catch (error) {
    console.error("❌ Get booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's bookings (IMPROVED ERROR HANDLING)
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    console.log("🔍 Fetching bookings for user:", userId);
    console.log("📊 Status filter:", status);

    // Validate userId
    if (!userId || userId === "undefined") {
      console.error("❌ Invalid user ID:", userId);
      return res.status(400).json({
        message: "Valid user ID is required",
        error: "INVALID_USER_ID",
      });
    }

    // Check if it's a valid MongoDB ObjectId
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error("❌ Invalid ObjectId format:", userId);
      return res.status(400).json({
        message: "Invalid user ID format",
        error: "INVALID_OBJECTID_FORMAT",
      });
    }

    // Build query
    const query = { user: userId };
    if (status && status !== "all") {
      query.status = status;
    }

    console.log("🔍 MongoDB query:", query);

    // Execute query with error handling
    const bookings = await Booking.find(query)
      .populate("driver", "name email phone rating.average")
      .populate("vehicle", "brand model plateNumber type pricing")
      .sort({ createdAt: -1 });

    console.log("✅ Found bookings:", bookings.length);

    res.status(200).json({
      message: "User bookings fetched successfully",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("❌ Get user bookings error:", error);
    console.error("❌ Error stack:", error.stack);

    // Handle specific error types
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid user ID format",
        error: "CAST_ERROR",
        details: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        error: "VALIDATION_ERROR",
        details: error.message,
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      userId: req.params.userId,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get driver's bookings
router.get("/driver/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status } = req.query;

    console.log("🔍 Fetching bookings for driver:", driverId);

    // Validate driverId
    if (!driverId || driverId === "undefined") {
      return res.status(400).json({
        message: "Valid driver ID is required",
        error: "INVALID_DRIVER_ID",
      });
    }

    if (!driverId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid driver ID format",
        error: "INVALID_OBJECTID_FORMAT",
      });
    }

    const query = { driver: driverId };
    if (status && status !== "all") {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("user", "name email phone")
      .populate("vehicle", "brand model plateNumber type")
      .sort({ createdAt: -1 });

    console.log("✅ Found driver bookings:", bookings.length);

    res.status(200).json({
      message: "Driver bookings fetched successfully",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("❌ Get driver bookings error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      driverId: req.params.driverId,
    });
  }
});

// Update booking status (confirm/reject/cancel)
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, updatedBy } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "rejected",
      "started",
      "completed",
      "cancelled",
      "no_show",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        validStatuses,
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update status and timestamp
    booking.status = status;

    switch (status) {
      case "confirmed":
        booking.confirmedAt = new Date();
        break;
      case "rejected":
        booking.rejectedAt = new Date();
        if (reason) booking.cancellationReason = reason;
        break;
      case "cancelled":
        booking.cancelledAt = new Date();
        if (reason) booking.cancellationReason = reason;
        if (updatedBy) booking.cancelledBy = updatedBy;
        break;
      case "started":
        booking.tripProgress.startTime = new Date();
        break;
      case "completed":
        booking.tripProgress.endTime = new Date();
        booking.payment.status = "paid";
        booking.payment.paidAt = new Date();
        break;
    }

    await booking.save();

    // Populate for response
    await booking.populate([
      { path: "user", select: "name email phone" },
      { path: "driver", select: "name email phone" },
      { path: "vehicle", select: "brand model plateNumber type" },
    ]);

    console.log("✅ Booking status updated:", booking._id, "to", status);

    res.status(200).json({
      message: `Booking ${status} successfully`,
      booking,
    });
  } catch (error) {
    console.error("❌ Update booking status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Calculate booking price
router.post("/calculate-price", async (req, res) => {
  try {
    const { vehicleId, distance, estimatedDuration } = req.body;

    console.log("💰 Calculating price for:", {
      vehicleId,
      distance,
      estimatedDuration,
    });

    if (!vehicleId || !distance || !estimatedDuration) {
      return res.status(400).json({
        message: "Vehicle ID, distance, and estimated duration are required",
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Create temporary booking object for price calculation
    const tempBooking = new Booking({
      tripDetails: { distance, estimatedDuration },
    });

    const pricing = tempBooking.calculatePrice(vehicle);

    console.log("✅ Price calculated:", pricing);

    res.status(200).json({
      message: "Price calculated successfully",
      pricing: {
        ...pricing,
        currency: vehicle.pricing.currency,
        breakdown: {
          basePrice: `${pricing.basePrice} BDT (Starting fare)`,
          distancePrice: `${pricing.distancePrice} BDT (${distance} km × ${vehicle.pricing.pricePerKm} BDT/km)`,
          timePrice: `${pricing.timePrice} BDT (${Math.round(
            estimatedDuration / 60
          )} hours × ${vehicle.pricing.pricePerHour} BDT/hour)`,
          minimumFare: `${vehicle.pricing.minimumFare} BDT (Minimum charge)`,
        },
      },
    });
  } catch (error) {
    console.error("❌ Calculate price error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
