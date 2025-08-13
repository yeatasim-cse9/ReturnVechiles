import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { bookingAPI, healthCheck } from "../services/api";
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  User,
  Phone,
  Car,
  Navigation,
  CreditCard,
  Star,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  PlayCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
} from "lucide-react";
import toast from "react-hot-toast";

const MyBookings = () => {
  const { dbUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [apiHealth, setApiHealth] = useState({ status: "unknown" });
  const [retryCount, setRetryCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  const statusOptions = [
    {
      value: "all",
      label: "All Bookings",
      icon: <Calendar className="h-4 w-4" />,
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "pending",
      label: "Pending",
      icon: <AlertCircle className="h-4 w-4" />,
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "confirmed",
      label: "Confirmed",
      icon: <CheckCircle className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "started",
      label: "Started",
      icon: <PlayCircle className="h-4 w-4" />,
      color: "bg-green-100 text-green-800",
    },
    {
      value: "completed",
      label: "Completed",
      icon: <CheckCircle className="h-4 w-4" />,
      color: "bg-green-100 text-green-800",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      icon: <XCircle className="h-4 w-4" />,
      color: "bg-red-100 text-red-800",
    },
  ];

  // Initial setup and health check
  useEffect(() => {
    const initializeBookings = async () => {
      try {
        console.log("🚀 Initializing MyBookings component...");

        // Check API health first
        const health = await healthCheck();
        setApiHealth(health);

        if (health.status === "healthy") {
          console.log("✅ API is healthy, proceeding with data fetch");
        } else {
          console.warn("⚠️ API health check failed:", health);
          toast.error("⚠️ API connection issue detected");
        }
      } catch (error) {
        console.error("❌ Health check failed:", error);
        setApiHealth({ status: "unhealthy", error: error.message });
      }

      // Always try to fetch bookings even if health check fails
      if (dbUser?.id) {
        await fetchBookings();
      } else {
        console.warn("⚠️ User ID not available:", dbUser);
        setInitialLoading(false);
      }
    };

    initializeBookings();
  }, [dbUser]);

  // Fetch bookings when status filter changes
  useEffect(() => {
    if (dbUser?.id && !initialLoading) {
      fetchBookings();
    }
  }, [selectedStatus]);

  const fetchBookings = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);

      // Validate user data
      if (!dbUser || !dbUser.id) {
        console.error("❌ User data not available:", dbUser);
        toast.error("User information not loaded. Please refresh the page.");
        return;
      }

      console.log(
        "🔄 Fetching bookings for user:",
        dbUser.id,
        "Status:",
        selectedStatus
      );

      // Test booking API connection first
      try {
        await bookingAPI.testConnection();
        console.log("✅ Booking API connection successful");
      } catch (testError) {
        console.warn("⚠️ Booking API test failed:", testError);
        toast.error("Booking API not responding. Please check server.");
        return;
      }

      const status = selectedStatus === "all" ? null : selectedStatus;
      const response = await bookingAPI.getUserBookings(dbUser.id, status);

      console.log(
        "✅ Bookings fetched successfully:",
        response.bookings?.length || 0
      );

      setBookings(response.bookings || []);
      calculateStats(response.bookings || []);
      setRetryCount(0); // Reset retry count on success

      if (response.bookings?.length === 0) {
        const message =
          selectedStatus === "all"
            ? "No bookings found. Start by searching for vehicles!"
            : `No ${selectedStatus} bookings found.`;

        // Don't show toast for empty results, just log
        console.log("ℹ️", message);
      }
    } catch (error) {
      console.error("❌ Failed to fetch bookings:", error);

      // Enhanced error handling
      if (error.response?.status === 400) {
        toast.error("❌ Invalid user data. Please login again.");
        console.error("❌ Bad request - User ID issue:", error.response.data);
      } else if (error.response?.status === 500) {
        toast.error("❌ Server error. Please try again or contact support.");
        console.error("❌ Server error details:", error.response.data);
      } else if (
        error.message?.includes("Network Error") ||
        error.code === "ECONNREFUSED"
      ) {
        toast.error(
          "❌ Cannot connect to server. Please check if the backend is running."
        );
        console.error("❌ Network/Connection error:", error.message);
      } else {
        toast.error("❌ Failed to load bookings. Please try again.");
        console.error("❌ Unknown error:", error);
      }

      // Set empty bookings on error
      setBookings([]);
      calculateStats([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const calculateStats = (bookingList) => {
    const stats = {
      total: bookingList.length,
      pending: bookingList.filter((b) => b.status === "pending").length,
      confirmed: bookingList.filter((b) => b.status === "confirmed").length,
      completed: bookingList.filter((b) => b.status === "completed").length,
      cancelled: bookingList.filter((b) => b.status === "cancelled").length,
    };
    setStats(stats);
  };

  const handleCancelBooking = async (bookingId, vehicleName) => {
    if (
      !confirm(
        `Are you sure you want to cancel the booking for ${vehicleName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      console.log("🚫 Cancelling booking:", bookingId);

      await bookingAPI.updateBookingStatus(
        bookingId,
        "cancelled",
        "Cancelled by user",
        "user"
      );

      toast.success("✅ Booking cancelled successfully");
      console.log("✅ Booking cancelled:", bookingId);

      // Refresh the list
      await fetchBookings(false);
    } catch (error) {
      console.error("❌ Cancel booking error:", error);

      if (error.response?.status === 404) {
        toast.error("❌ Booking not found");
      } else if (error.response?.status === 400) {
        toast.error("❌ Cannot cancel this booking");
      } else {
        toast.error("❌ Failed to cancel booking. Please try again.");
      }
    }
  };

  const handleRetry = async () => {
    setRetryCount((prev) => prev + 1);
    toast.loading("🔄 Retrying...", { id: "retry-toast" });

    try {
      await fetchBookings();
      toast.success("✅ Data refreshed successfully", { id: "retry-toast" });
    } catch (error) {
      toast.error("❌ Retry failed", { id: "retry-toast" });
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status);
    return statusOption?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status);
    return statusOption?.icon || <AlertCircle className="h-4 w-4" />;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const BookingCard = ({ booking }) => {
    const scheduledTime = formatDateTime(booking.scheduledDateTime);
    const vehicleName = `${booking.vehicle.brand} ${booking.vehicle.model}`;

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              <div>
                <h3 className="font-semibold">{vehicleName}</h3>
                <p className="text-blue-100 text-sm">
                  {booking.vehicle.plateNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(
                  booking.status
                )} bg-opacity-90`}
              >
                {getStatusIcon(booking.status)}
                <span className="ml-1">{booking.status.toUpperCase()}</span>
              </span>

              <div className="relative group">
                <button className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => console.log("View details:", booking._id)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Car className="mr-3 h-4 w-4" />
                    View Details
                  </button>

                  {booking.status === "pending" && (
                    <button
                      onClick={() =>
                        handleCancelBooking(booking._id, vehicleName)
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="mr-3 h-4 w-4" />
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Trip Route */}
          <div className="mb-4">
            <div className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-0.5 h-8 bg-gray-300 my-1"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Pickup</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {booking.tripDetails.pickupLocation.address}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Dropoff</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {booking.tripDetails.dropoffLocation.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <div>
                <p className="font-medium">{scheduledTime.date}</p>
                <p>{scheduledTime.time}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <Navigation className="h-4 w-4 mr-2" />
              <div>
                <p className="font-medium">{booking.tripDetails.distance} km</p>
                <p>{booking.tripDetails.estimatedDuration} mins</p>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900 text-sm">
                  {booking.driver.name}
                </p>
                <div className="flex items-center text-xs text-gray-600">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="ml-1">
                    {booking.driver.rating?.average > 0
                      ? booking.driver.rating.average.toFixed(1)
                      : "New"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                ৳{booking.pricing.totalPrice}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {booking.payment.method}
              </p>
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Special Requests:</p>
              <p className="text-sm text-gray-900">{booking.specialRequests}</p>
            </div>
          )}

          {/* Booking Time */}
          <div className="text-xs text-gray-500 border-t pt-3">
            Booked on {new Date(booking.bookedAt).toLocaleDateString()} at{" "}
            {new Date(booking.bookedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  // Show initial loading screen
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
          <p className="text-sm text-gray-500 mt-2">
            Setting up API connection
          </p>
        </div>
      </div>
    );
  }

  // Show user not found error
  if (!dbUser || !dbUser.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            User Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            Unable to load user information. Please try logging in again.
          </p>
          <div className="space-y-2">
            <a
              href="/login"
              className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Login Again
            </a>
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Bookings
              </h1>
              <p className="text-gray-600">
                Track and manage your vehicle bookings
              </p>
            </div>

            {/* API Health & Refresh */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                {apiHealth.status === "healthy" ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={
                    apiHealth.status === "healthy"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  API {apiHealth.status}
                </span>
              </div>

              <button
                onClick={handleRetry}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {retryCount > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              Retry attempts: {retryCount}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          {[
            {
              key: "total",
              label: "Total",
              icon: Calendar,
              color: "text-blue-600",
            },
            {
              key: "pending",
              label: "Pending",
              icon: AlertCircle,
              color: "text-yellow-600",
            },
            {
              key: "confirmed",
              label: "Confirmed",
              icon: CheckCircle,
              color: "text-blue-600",
            },
            {
              key: "completed",
              label: "Completed",
              icon: CheckCircle,
              color: "text-green-600",
            },
            {
              key: "cancelled",
              label: "Cancelled",
              icon: XCircle,
              color: "text-red-600",
            },
          ].map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center">
                <Icon className={`h-8 w-8 ${color}`} />
                <div className="ml-3">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats[key]}
                  </p>
                  <p className="text-gray-600 text-sm">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {option.icon}
                <span className="ml-2">{option.label}</span>
                {option.value !== "all" && stats[option.value] > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      selectedStatus === option.value
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {stats[option.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedStatus === "all"
                ? "No bookings found"
                : `No ${selectedStatus} bookings`}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedStatus === "all"
                ? "Start by searching for vehicles and making your first booking"
                : `You don't have any ${selectedStatus} bookings at the moment`}
            </p>
            <div className="space-y-3">
              <a
                href="/search"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Car className="h-5 w-5 mr-2" />
                Search Vehicles
              </a>

              {apiHealth.status !== "healthy" && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center text-yellow-800">
                    <Database className="h-5 w-5 mr-2" />
                    <span className="text-sm">
                      API connection issue detected. Please try refreshing or
                      contact support.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} />
            ))}
          </div>
        )}

        {/* Footer Info */}
        {bookings.length > 0 && (
          <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Booking Management Tips
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • You can cancel pending bookings up to 1 hour before
                    scheduled time
                  </li>
                  <li>
                    • Contact your driver directly for any special requirements
                  </li>
                  <li>• Rate your trip after completion to help other users</li>
                  <li>
                    • Keep track of your booking status for timely updates
                  </li>
                </ul>
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {apiHealth.status === "healthy"
                    ? "Connected to Server"
                    : "Connection Issues"}
                </div>
                <div className="text-xs text-gray-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
