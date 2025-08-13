import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// API functions
export const authAPI = {
  // Sync user with backend after Firebase registration
  syncUser: async (userData) => {
    try {
      const response = await api.post("/auth/sync-user", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user by Firebase UID
  getUserByUID: async (firebaseUid) => {
    try {
      const response = await api.get(`/auth/user/${firebaseUid}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all users (for testing)
  getAllUsers: async () => {
    try {
      const response = await api.get("/auth/users");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default api;
