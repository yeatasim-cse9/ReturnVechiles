const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["car", "ambulance", "truck", "motorcycle", "bus"],
      required: true,
    },
    // Basic Information
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1990,
      max: new Date().getFullYear() + 1,
    },
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },

    // Capacity & Features
    capacity: {
      passengers: {
        type: Number,
        required: true,
        min: 1,
      },
      luggage: {
        type: String,
        enum: ["small", "medium", "large", "extra-large"],
        default: "medium",
      },
    },

    features: [
      {
        type: String,
        enum: [
          "AC",
          "Heater",
          "GPS",
          "Music System",
          "WiFi",
          "USB Charging",
          "Leather Seats",
          "Sunroof",
          "Backup Camera",
          "Bluetooth",
          "First Aid Kit",
        ],
      },
    ],

    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      pricePerKm: {
        type: Number,
        required: true,
        min: 0,
      },
      pricePerHour: {
        type: Number,
        required: true,
        min: 0,
      },
      minimumFare: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "BDT",
      },
    },

    // Location
    location: {
      city: {
        type: String,
        required: true,
      },
      area: {
        type: String,
        required: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
      address: String,
    },

    // Availability
    availability: {
      isActive: {
        type: Boolean,
        default: true,
      },
      isAvailable: {
        type: Boolean,
        default: true,
      },
      availableHours: {
        start: {
          type: String,
          default: "06:00",
        },
        end: {
          type: String,
          default: "22:00",
        },
      },
      availableDays: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
          default: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
      ],
    },

    // Documents & Verification
    documents: {
      registration: {
        number: String,
        expiryDate: Date,
        imageUrl: String,
      },
      insurance: {
        number: String,
        provider: String,
        expiryDate: Date,
        imageUrl: String,
      },
      fitness: {
        number: String,
        expiryDate: Date,
        imageUrl: String,
      },
    },

    // Images
    images: [
      {
        url: String,
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Rating & Reviews
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    // Statistics
    stats: {
      totalTrips: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      totalDistance: {
        type: Number,
        default: 0,
      },
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },

    // Meta
    description: {
      type: String,
      maxlength: 500,
    },
    tags: [String],

    // Timestamps for specific events
    approvedAt: Date,
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better search performance
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ "location.city": 1, "location.area": 1 });
vehicleSchema.index({
  "availability.isActive": 1,
  "availability.isAvailable": 1,
});
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ driver: 1 });
vehicleSchema.index({ "rating.average": -1 });
vehicleSchema.index({ "pricing.pricePerKm": 1 });
vehicleSchema.index({ createdAt: -1 });

// Compound index for location-based search
vehicleSchema.index({
  "location.coordinates.latitude": 1,
  "location.coordinates.longitude": 1,
});

// Text search index
vehicleSchema.index({
  brand: "text",
  model: "text",
  "location.city": "text",
  "location.area": "text",
  description: "text",
});

// Virtual for getting primary image
vehicleSchema.virtual("primaryImage").get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary ? primary.url : this.images[0] ? this.images[0].url : null;
});

// Virtual for checking if documents are complete
vehicleSchema.virtual("documentsComplete").get(function () {
  return !!(
    this.documents.registration?.number &&
    this.documents.insurance?.number &&
    this.documents.fitness?.number
  );
});

// Method to calculate distance-based price
vehicleSchema.methods.calculatePrice = function (distance, duration) {
  const basePrice = this.pricing.basePrice;
  const distancePrice = distance * this.pricing.pricePerKm;
  const timePrice = duration * this.pricing.pricePerHour;

  const totalPrice = Math.max(
    basePrice + distancePrice + timePrice,
    this.pricing.minimumFare
  );

  return Math.round(totalPrice);
};

// Method to check availability for specific date/time
vehicleSchema.methods.isAvailableAt = function (dateTime) {
  if (!this.availability.isActive || !this.availability.isAvailable) {
    return false;
  }

  const date = new Date(dateTime);
  const dayName = date
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const timeString = date.toTimeString().slice(0, 5);

  const isDayAvailable = this.availability.availableDays.includes(dayName);
  const isTimeAvailable =
    timeString >= this.availability.availableHours.start &&
    timeString <= this.availability.availableHours.end;

  return isDayAvailable && isTimeAvailable;
};

// Static method for search
vehicleSchema.statics.searchVehicles = function (searchParams) {
  const {
    type,
    city,
    area,
    minPrice,
    maxPrice,
    capacity,
    features,
    sortBy = "rating.average",
    sortOrder = -1,
    page = 1,
    limit = 10,
  } = searchParams;

  let query = {
    "availability.isActive": true,
    "availability.isAvailable": true,
    status: "approved",
  };

  if (type) query.type = type;
  if (city) query["location.city"] = new RegExp(city, "i");
  if (area) query["location.area"] = new RegExp(area, "i");
  if (minPrice) query["pricing.pricePerKm"] = { $gte: minPrice };
  if (maxPrice) {
    query["pricing.pricePerKm"] = query["pricing.pricePerKm"]
      ? { ...query["pricing.pricePerKm"], $lte: maxPrice }
      : { $lte: maxPrice };
  }
  if (capacity) query["capacity.passengers"] = { $gte: capacity };
  if (features && features.length > 0) {
    query.features = { $in: features };
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate("driver", "name email phone rating.average rating.count")
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model("Vehicle", vehicleSchema);
