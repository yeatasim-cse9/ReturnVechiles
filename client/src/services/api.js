import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log("🔄 API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ API Response Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Sync Firebase user with MongoDB
  syncUser: async (userData) => {
    try {
      const response = await api.post("/auth/sync-user", userData);
      return response.data;
    } catch (error) {
      console.error("🚨 Auth API - syncUser error:", error);
      throw error;
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get("/auth/users");
      return response.data;
    } catch (error) {
      console.error("🚨 Auth API - getAllUsers error:", error);
      throw error;
    }
  },

  // Get user by Firebase UID
  getUserByUID: async (firebaseUid) => {
    try {
      const response = await api.get(`/auth/user/${firebaseUid}`);
      return response.data;
    } catch (error) {
      console.error("🚨 Auth API - getUserByUID error:", error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (updateData) => {
    try {
      const response = await api.put("/auth/update-profile", updateData);
      return response.data;
    } catch (error) {
      console.error("🚨 Auth API - updateProfile error:", error);
      throw error;
    }
  },
};

// Vehicle API functions
export const vehicleAPI = {
  // Get all vehicles with filters
  getVehicles: async (filters = {}) => {
    try {
      const response = await api.get("/vehicles", { params: filters });
      return response.data;
    } catch (error) {
      console.error("🚨 Vehicle API - getVehicles error:", error);
      throw error;
    }
  },

  // Get vehicle by ID
  getVehicleById: async (vehicleId) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error("🚨 Vehicle API - getVehicleById error:", error);
      throw error;
    }
  },

  // Get vehicles by driver
  getVehiclesByDriver: async (driverId) => {
    try {
      const response = await api.get(`/vehicles/driver/${driverId}`);
      return response.data;
    } catch (error) {
      console.error("🚨 Vehicle API - getVehiclesByDriver error:", error);
      throw error;
    }
  },

  // Create new vehicle
  createVehicle: async (vehicleData) => {
    try {
      const response = await api.post("/vehicles", vehicleData);
      return response.data;
    } catch (error) {
      console.error("🚨 Vehicle API - createVehicle error:", error);
      throw error;
    }
  },

  // Update vehicle
  updateVehicle: async (vehicleId, updateData) => {
    try {
      const response = await api.put(`/vehicles/${vehicleId}`, updateData);
      return response.data;
    } catch (error) {
      console.error("🚨 Vehicle API - updateVehicle error:", error);
      throw error;
    }
  },

  // Delete vehicle
  deleteVehicle: async (vehicleId) => {
    try {
      const response = await api.delete(`/vehicles/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error("🚨 Vehicle API - deleteVehicle error:", error);
      throw error;
    }
  },

  // Get filter options
  getFilterOptions: async () => {
    try {
      const response = await api.get("/vehicles/meta/filters");
      return response.data;
    } catch (error) {
      console.error("🚨 Vehicle API - getFilterOptions error:", error);
      throw error;
    }
  },

  // Calculate trip price
  calculatePrice: async (vehicleId, distance, duration) => {
    try {
      const response = await api.post("/vehicles/calculate-price", {
        vehicleId,
        distance,
        duration,
      });
      return response.data;
    } catch (error) {
      console.error("🚨 Vehicle API - calculatePrice error:", error);
      throw error;
    }
  },
};

// 🔥 Booking API functions (IMPROVED WITH BETTER ERROR HANDLING)
export const bookingAPI = {
  // Test booking API connection
  testConnection: async () => {
    try {
      console.log("🧪 Testing booking API connection...");
      const response = await api.get("/bookings/test");
      console.log("✅ Booking API test successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("🚨 Booking API - testConnection error:", error);
      throw error;
    }
  },

  // Test database connection
  testDatabase: async () => {
    try {
      console.log("🧪 Testing booking database...");
      const response = await api.get("/bookings/db-test");
      console.log("✅ Booking database test successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("🚨 Booking API - testDatabase error:", error);
      throw error;
    }
  },

  // Create new booking
  createBooking: async (bookingData) => {
    try {
      console.log("📅 Creating booking with data:", bookingData);
      const response = await api.post("/bookings", bookingData);
      console.log("✅ Booking created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("🚨 Booking API - createBooking error:", error);
      console.error("🚨 Error details:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  // Get all bookings (admin)
  getAllBookings: async (filters = {}) => {
    try {
      console.log("📋 Fetching all bookings with filters:", filters);
      const response = await api.get("/bookings", { params: filters });
      console.log(
        "✅ All bookings fetched:",
        response.data.bookings?.length || 0
      );
      return response.data;
    } catch (error) {
      console.error("🚨 Booking API - getAllBookings error:", error);
      throw error;
    }
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    try {
      console.log("🔍 Fetching booking by ID:", bookingId);
      const response = await api.get(`/bookings/${bookingId}`);
      console.log("✅ Booking found:", response.data.booking?._id);
      return response.data;
    } catch (error) {
      console.error("🚨 Booking API - getBookingById error:", error);
      throw error;
    }
  },

  // Get user's bookings (IMPROVED WITH VALIDATION)
  getUserBookings: async (userId, status = null) => {
    try {
      // Input validation
      if (!userId) {
        throw new Error("User ID is required");
      }

      if (userId === "undefined" || userId === "null") {
        throw new Error("Invalid user ID: " + userId);
      }

      console.log("👤 Fetching user bookings:", { userId, status });

      const params = {};
      if (status && status !== "all") {
        params.status = status;
      }

      const response = await api.get(`/bookings/user/${userId}`, { params });
      console.log(
        "✅ User bookings fetched:",
        response.data.bookings?.length || 0
      );

      return response.data;
    } catch (error) {
      console.error("🚨 Booking API - getUserBookings error:", error);
      console.error("🚨 User ID:", userId);
      console.error("🚨 Status filter:", status);

      // Enhanced error information
      if (error.response?.status === 400) {
        console.error("🚨 Bad Request - Invalid user ID format");
      } else if (error.response?.status === 500) {
        console.error("🚨 Server Error - Check backend logs");
      }

      throw error;
    }
  },

  // Get driver's bookings (IMPROVED WITH VALIDATION)
  getDriverBookings: async (driverId, status = null) => {
    try {
      // Input validation
      if (!driverId) {
        throw new Error("Driver ID is required");
      }

      if (driverId === "undefined" || driverId === "null") {
        throw new Error("Invalid driver ID: " + driverId);
      }

      console.log("🚗 Fetching driver bookings:", { driverId, status });

      const params = {};
      if (status && status !== "all") {
        params.status = status;
      }

      const response = await api.get(`/bookings/driver/${driverId}`, {
        params,
      });
      console.log(
        "✅ Driver bookings fetched:",
        response.data.bookings?.length || 0
      );

      return response.data;
    } catch (error) {
      console.error("🚨 Booking API - getDriverBookings error:", error);
      console.error("🚨 Driver ID:", driverId);
      console.error("🚨 Status filter:", status);
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (
    bookingId,
    status,
    reason = null,
    updatedBy = null
  ) => {
    try {
      console.log("🔄 Updating booking status:", {
        bookingId,
        status,
        reason,
        updatedBy,
      });

      const response = await api.put(`/bookings/${bookingId}/status`, {
        status,
        reason,
        updatedBy,
      });

      console.log("✅ Booking status updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("🚨 Booking API - updateBookingStatus error:", error);
      throw error;
    }
  },

  // Calculate booking price
  calculateBookingPrice: async (vehicleId, distance, estimatedDuration) => {
    try {
      console.log("💰 Calculating booking price:", {
        vehicleId,
        distance,
        estimatedDuration,
      });

      const response = await api.post("/bookings/calculate-price", {
        vehicleId,
        distance,
        estimatedDuration,
      });

      console.log("✅ Price calculated:", response.data.pricing);
      return response.data;
    } catch (error) {
      console.error("🚨 Booking API - calculateBookingPrice error:", error);
      throw error;
    }
  },
};

// API Health Check Function
export const healthCheck = async () => {
  try {
    console.log("🏥 Performing API health check...");

    const healthResponse = await api.get("/health");
    console.log("✅ API Health:", healthResponse.data);

    // Test booking API specifically
    const bookingTest = await bookingAPI.testConnection();
    console.log("✅ Booking API Health:", bookingTest);

    return {
      api: healthResponse.data,
      bookings: bookingTest,
      status: "healthy",
    };
  } catch (error) {
    console.error("🚨 Health check failed:", error);
    return {
      status: "unhealthy",
      error: error.message,
    };
  }
};

export default api;
