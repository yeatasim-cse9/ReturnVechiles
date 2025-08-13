const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "driver", "admin"],
      default: "user",
    },
    profileImage: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Driver specific fields
    driverDetails: {
      licenseNumber: String,
      licenseExpiry: Date,
      vehicleType: {
        type: String,
        enum: ["car", "ambulance", "truck"],
      },
      experience: Number, // years
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      totalTrips: {
        type: Number,
        default: 0,
      },
    },
    // Address information
    address: {
      street: String,
      city: String,
      division: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    // Google sign-in specific fields
    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    googleId: String,
    profileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index definitions (removing duplicates)
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ role: 1 });
userSchema.index({ googleId: 1 });

// Virtual for checking if profile is complete
userSchema.virtual("isProfileComplete").get(function () {
  return this.name && this.email && this.phone && this.phone.length > 0;
});

// Pre-save middleware for Google users
userSchema.pre("save", function (next) {
  // If it's a Google sign-in user without phone, mark profile as incomplete
  if (this.authProvider === "google" && (!this.phone || this.phone === "")) {
    this.profileComplete = false;
  } else if (this.phone && this.phone.length > 0) {
    this.profileComplete = true;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
