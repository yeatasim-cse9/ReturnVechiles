const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Trip Basic Information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    // Trip Details
    tripDetails: {
      pickupLocation: {
        address: {
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
      },
      dropoffLocation: {
        address: {
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
      },
      distance: {
        type: Number, // in kilometers
        required: true,
      },
      estimatedDuration: {
        type: Number, // in minutes
        required: true,
      },
    },

    // Scheduling
    scheduledDateTime: {
      type: Date,
      required: true,
    },

    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      distancePrice: {
        type: Number,
        required: true,
      },
      timePrice: {
        type: Number,
        default: 0,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "BDT",
      },
    },

    // Booking Status
    status: {
      type: String,
      enum: [
        "pending", // Driver hasn't responded yet
        "confirmed", // Driver accepted the booking
        "rejected", // Driver rejected the booking
        "started", // Trip has started
        "completed", // Trip completed successfully
        "cancelled", // Cancelled by user or driver
        "no_show", // User didn't show up
      ],
      default: "pending",
    },

    // Trip Progress
    tripProgress: {
      startTime: Date,
      endTime: Date,
      actualDistance: Number,
      actualDuration: Number,
      route: [
        {
          timestamp: Date,
          coordinates: {
            latitude: Number,
            longitude: Number,
          },
        },
      ],
    },

    // Payment Information
    payment: {
      method: {
        type: String,
        enum: ["cash", "card", "mobile_banking", "wallet"],
        default: "cash",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "refunded", "failed"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
    },

    // Additional Information
    specialRequests: String,
    notes: String,

    // Rating & Review
    rating: {
      userRating: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        ratedAt: Date,
      },
      driverRating: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        ratedAt: Date,
      },
    },

    // Timestamps
    bookedAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: Date,
    rejectedAt: Date,
    cancelledAt: Date,

    // Cancellation Details
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ["user", "driver", "admin"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ driver: 1, createdAt: -1 });
bookingSchema.index({ vehicle: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ scheduledDateTime: 1 });
bookingSchema.index({
  "tripDetails.pickupLocation.coordinates.latitude": 1,
  "tripDetails.pickupLocation.coordinates.longitude": 1,
});

// Virtual for total trip time
bookingSchema.virtual("totalTripTime").get(function () {
  if (this.tripProgress.startTime && this.tripProgress.endTime) {
    return Math.round(
      (this.tripProgress.endTime - this.tripProgress.startTime) / (1000 * 60)
    ); // in minutes
  }
  return this.tripDetails.estimatedDuration;
});

// Method to calculate price
bookingSchema.methods.calculatePrice = function (vehicle) {
  const basePrice = vehicle.pricing.basePrice;
  const distancePrice = this.tripDetails.distance * vehicle.pricing.pricePerKm;
  const timePrice =
    (this.tripDetails.estimatedDuration / 60) * vehicle.pricing.pricePerHour;

  const totalPrice = Math.max(
    basePrice + distancePrice + timePrice,
    vehicle.pricing.minimumFare
  );

  return {
    basePrice,
    distancePrice,
    timePrice,
    totalPrice: Math.round(totalPrice),
  };
};

// Static method to get bookings by status
bookingSchema.statics.getBookingsByStatus = function (status) {
  return this.find({ status })
    .populate("user", "name email phone")
    .populate("driver", "name email phone rating.average")
    .populate("vehicle", "brand model plateNumber type")
    .sort({ createdAt: -1 });
};

// Static method for driver's bookings
bookingSchema.statics.getDriverBookings = function (driverId, status = null) {
  const query = { driver: driverId };
  if (status) query.status = status;

  return this.find(query)
    .populate("user", "name email phone")
    .populate("vehicle", "brand model plateNumber type")
    .sort({ createdAt: -1 });
};

// Static method for user's bookings
bookingSchema.statics.getUserBookings = function (userId, status = null) {
  const query = { user: userId };
  if (status) query.status = status;

  return this.find(query)
    .populate("driver", "name email phone rating.average")
    .populate("vehicle", "brand model plateNumber type pricing")
    .sort({ createdAt: -1 });
};

// Pre-save middleware for validation
bookingSchema.pre("save", function (next) {
  // Validate that scheduled time is in the future
  if (
    this.scheduledDateTime &&
    new Date(this.scheduledDateTime) <= new Date()
  ) {
    const error = new Error("Scheduled time must be in the future");
    error.path = "scheduledDateTime";
    return next(error);
  }

  // Validate that pickup and dropoff are different
  if (
    this.tripDetails.pickupLocation.address ===
    this.tripDetails.dropoffLocation.address
  ) {
    const error = new Error("Pickup and dropoff locations cannot be the same");
    error.path = "tripDetails";
    return next(error);
  }

  // Auto-set booking timestamp
  if (this.isNew && !this.bookedAt) {
    this.bookedAt = new Date();
  }

  next();
});

// Post-save middleware for logging
bookingSchema.post("save", function (doc) {
  console.log("✅ Booking saved:", doc._id, "Status:", doc.status);
});

// Post-remove middleware for cleanup
bookingSchema.post("remove", function (doc) {
  console.log("🗑️ Booking removed:", doc._id);
});

// Transform function for JSON output
bookingSchema.set("toJSON", {
  transform: function (doc, ret, options) {
    // Remove sensitive information
    delete ret.__v;

    // Format dates
    if (ret.scheduledDateTime) {
      ret.scheduledDateTime = new Date(ret.scheduledDateTime).toISOString();
    }
    if (ret.bookedAt) {
      ret.bookedAt = new Date(ret.bookedAt).toISOString();
    }
    if (ret.createdAt) {
      ret.createdAt = new Date(ret.createdAt).toISOString();
    }
    if (ret.updatedAt) {
      ret.updatedAt = new Date(ret.updatedAt).toISOString();
    }

    return ret;
  },
});

// 🔥 CRITICAL: This must be the exact export line
module.exports = mongoose.model("Booking", bookingSchema);
