const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Register or sync user from Firebase (Updated for Google sign-in)
router.post("/sync-user", async (req, res) => {
  try {
    const { firebaseUid, email, name, phone, role, authProvider } = req.body;

    console.log("Sync user request:", {
      firebaseUid,
      email,
      name,
      role,
      authProvider,
    });

    // Validation (phone is now optional)
    if (!firebaseUid || !email || !name) {
      return res.status(400).json({
        message: "Firebase UID, email, and name are required",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });

    if (user) {
      console.log("User already exists:", user.email);

      // Update existing user if needed (for profile completion)
      if (phone && phone !== "" && (!user.phone || user.phone === "")) {
        user.phone = phone;
        user.profileComplete = true;
        await user.save();
        console.log("Updated existing user with phone:", user.email);
      }

      return res.status(200).json({
        message: "User already exists",
        user: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          profileComplete: user.profileComplete,
          authProvider: user.authProvider,
          createdAt: user.createdAt,
        },
      });
    }

    // Create new user
    user = new User({
      firebaseUid,
      email,
      name,
      phone: phone || "", // Default to empty string if not provided
      role: role || "user",
      authProvider: authProvider || (phone ? "email" : "google"),
      profileComplete: !!(phone && phone !== ""),
    });

    await user.save();
    console.log("New user created:", user.email);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        profileComplete: user.profileComplete,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Sync user error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    // Handle validation errors more gracefully
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (e) => e.message
      );
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// Get all users (for testing)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select("-__v").sort({ createdAt: -1 });

    res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user by Firebase UID
router.get("/user/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const user = await User.findOne({ firebaseUid }).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User found",
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile (for completing Google sign-in profiles)
router.put("/update-profile", async (req, res) => {
  try {
    const { firebaseUid, phone, address, driverDetails } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ message: "Firebase UID required" });
    }

    const updateData = {};
    if (phone) {
      updateData.phone = phone;
      updateData.profileComplete = true;
    }
    if (address) updateData.address = address;
    if (driverDetails) updateData.driverDetails = driverDetails;

    const user = await User.findOneAndUpdate({ firebaseUid }, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
