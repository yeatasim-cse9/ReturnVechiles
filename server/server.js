require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(morgan("combined"));

// CORS configuration (Updated for Google Sign-in fix)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log("📊 Database:", mongoose.connection.name);

    // Test collections
    console.log("📋 Testing collections...");
    mongoose.connection.db
      .listCollections()
      .toArray()
      .then((collections) => {
        console.log(
          "📂 Available collections:",
          collections.map((c) => c.name)
        );
      })
      .catch((err) => console.log("⚠️ Collection test failed:", err.message));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/bookings", require("./routes/bookings"));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "ReturnVehicle API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    server: "Healthy",
    cors: "Enabled",
    version: "1.0.0",
  });
});

// Test route for frontend connection
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend API working perfectly!",
    frontend_connected: true,
    timestamp: new Date().toISOString(),
    server_status: "Running",
    mongodb_status:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// API status route
app.get("/api/status", (req, res) => {
  res.json({
    status: "Active",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: {
      status:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
    environment: process.env.NODE_ENV,
    version: "1.0.0",
    routes: {
      auth: "/api/auth",
      vehicles: "/api/vehicles",
      bookings: "/api/bookings",
      health: "/api/health",
      test: "/api/test",
      status: "/api/status",
    },
  });
});

// Database statistics route
app.get("/api/stats", async (req, res) => {
  try {
    const User = require("./models/User");
    const Vehicle = require("./models/Vehicle");
    const Booking = require("./models/Booking");

    const userCount = await User.countDocuments();
    const vehicleCount = await Vehicle.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({
      "availability.isActive": true,
      "availability.isAvailable": true,
    });
    const drivers = await User.countDocuments({ role: "driver" });
    const users = await User.countDocuments({ role: "user" });

    res.json({
      message: "Statistics fetched successfully",
      stats: {
        users: {
          total: userCount,
          drivers: drivers,
          passengers: users,
        },
        vehicles: {
          total: vehicleCount,
          active: activeVehicles,
          inactive: vehicleCount - activeVehicles,
        },
        bookings: {
          total: bookingCount,
        },
        system: {
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: {
      auth: "/api/auth",
      vehicles: "/api/vehicles",
      bookings: "/api/bookings",
      health: "/api/health",
      test: "/api/test",
      status: "/api/status",
      stats: "/api/stats",
    },
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("🚨 Server Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: "Validation Error",
      errors: errors,
      timestamp: new Date().toISOString(),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(400).json({
      message: `Duplicate ${field}. The ${field} '${value}' already exists.`,
      field: field,
      value: value,
      timestamp: new Date().toISOString(),
    });
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token",
      timestamp: new Date().toISOString(),
    });
  }

  // Cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`,
      timestamp: new Date().toISOString(),
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  console.log("🔄 SIGTERM received. Shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🔄 SIGINT received. Shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  });
});

// Uncaught exception handler
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

// Unhandled promise rejection handler
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 =====================================");
  console.log(`🚀 ReturnVehicle Server Started`);
  console.log("🚀 =====================================");
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔗 Frontend URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`
  );
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📈 Status endpoint: http://localhost:${PORT}/api/status`);
  console.log(`📊 Statistics: http://localhost:${PORT}/api/stats`);
  console.log("🚀 =====================================");
  console.log("📋 Available API Routes:");
  console.log("   🔐 Auth: /api/auth/*");
  console.log("   🚗 Vehicles: /api/vehicles/*");
  console.log("   📅 Bookings: /api/bookings/*");
  console.log("   ⚡ Health: /api/health");
  console.log("   🧪 Test: /api/test");
  console.log("   📈 Status: /api/status");
  console.log("   📊 Stats: /api/stats");
  console.log("🚀 =====================================");
});
