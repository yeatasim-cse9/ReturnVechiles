import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [dbUser, setDbUser] = useState(null);

  // Sync Firebase user with MongoDB (with better error handling)
  const syncWithBackend = async (
    firebaseUser,
    additionalData = {},
    retries = 3
  ) => {
    try {
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || additionalData.name || "User",
        phone: additionalData.phone || "",
        role: additionalData.role || "user",
      };

      console.log("🔄 Syncing user with backend:", userData);

      const response = await authAPI.syncUser(userData);
      setDbUser(response.user);
      setUserRole(response.user.role);

      console.log("✅ User synced successfully:", response.user);
      return response.user;
    } catch (error) {
      console.error("❌ Backend sync error:", error);

      // Retry mechanism
      if (retries > 0) {
        console.log(`🔄 Retrying sync... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        return await syncWithBackend(firebaseUser, additionalData, retries - 1);
      }

      // Show user-friendly error
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network Error")
      ) {
        toast.error(
          "❌ Backend server is not running. Please start the server."
        );
      } else if (error.message?.includes("CORS")) {
        toast.error("❌ CORS error. Please check server configuration.");
      } else {
        toast.error("❌ Failed to sync user data. Please try again.");
      }

      throw error;
    }
  };

  // Sign up with email and password
  const signup = async (email, password, name, phone = "", role = "user") => {
    try {
      setLoading(true);

      // Create Firebase user
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update Firebase profile
      await updateProfile(result.user, {
        displayName: name,
      });

      // Sync with MongoDB (with retry)
      await syncWithBackend(result.user, { name, phone, role });

      toast.success("✅ Account created successfully!");
      return result;
    } catch (error) {
      console.error("❌ Signup error:", error);

      if (error.code === "auth/email-already-in-use") {
        toast.error("❌ Email already in use");
      } else if (error.code === "auth/weak-password") {
        toast.error("❌ Password too weak");
      } else {
        toast.error("❌ Registration failed. Please try again.");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      setLoading(true);

      const result = await signInWithEmailAndPassword(auth, email, password);

      // Sync with backend
      try {
        await syncWithBackend(result.user);
      } catch (syncError) {
        console.warn(
          "⚠️ Backend sync failed during login, but user is logged in to Firebase"
        );
        // Continue with login even if sync fails
      }

      toast.success("✅ Logged in successfully!");
      return result;
    } catch (error) {
      console.error("❌ Login error:", error);

      if (error.code === "auth/user-not-found") {
        toast.error("❌ No account found with this email");
      } else if (error.code === "auth/wrong-password") {
        toast.error("❌ Incorrect password");
      } else {
        toast.error("❌ Login failed. Please try again.");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google (improved error handling)
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      toast.loading("🔄 Connecting to Google...", { id: "google-signin" });

      const provider = new GoogleAuthProvider();
      // Add scopes for better user info
      provider.addScope("email");
      provider.addScope("profile");

      const result = await signInWithPopup(auth, provider);

      toast.loading("🔄 Syncing user data...", { id: "google-signin" });

      // Sync with backend
      await syncWithBackend(result.user);

      toast.success("✅ Logged in with Google successfully!", {
        id: "google-signin",
      });
      return result;
    } catch (error) {
      console.error("❌ Google sign-in error:", error);
      toast.dismiss("google-signin");

      if (error.code === "auth/popup-closed-by-user") {
        toast.error("❌ Sign-in cancelled by user");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("❌ Popup blocked. Please enable popups and try again.");
      } else if (error.code === "auth/network-request-failed") {
        toast.error("❌ Network error. Please check your internet connection.");
      } else if (error.message?.includes("Failed to sync")) {
        toast.error(
          "❌ Google sign-in successful but backend sync failed. Please try again."
        );
      } else {
        toast.error("❌ Google sign-in failed. Please try again.");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      setDbUser(null);
      toast.success("✅ Logged out successfully!");
    } catch (error) {
      console.error("❌ Logout error:", error);
      toast.error("❌ Logout failed");
      throw error;
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        console.log("🔄 Firebase user state changed:", firebaseUser.email);

        try {
          // Try to get user from backend first
          const backendUser = await authAPI.getUserByUID(firebaseUser.uid);
          setDbUser(backendUser.user);
          setUserRole(backendUser.user.role);
          console.log("✅ Backend user found:", backendUser.user);
        } catch (error) {
          console.warn("⚠️ Backend user not found, attempting sync...");

          try {
            // User not in backend, try to sync
            await syncWithBackend(firebaseUser);
          } catch (syncError) {
            console.error("❌ Auto-sync failed:", syncError);
            // Don't show error toast on auto-sync failure
          }
        }
      } else {
        // User signed out
        setDbUser(null);
        setUserRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user, // Firebase user
    dbUser, // MongoDB user data
    userRole,
    setUserRole,
    loading,
    signup,
    login,
    signInWithGoogle,
    logout,
    syncWithBackend,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
