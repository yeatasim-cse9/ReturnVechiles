import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Car,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Star,
  Users,
  DollarSign,
  Calendar,
  MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";

const MyVehicles = () => {
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
  });

  // Check if user is a driver
  if (!dbUser || dbUser.role !== "driver") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            Only drivers can access vehicle management.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchMyVehicles();
  }, []);

  const fetchMyVehicles = async () => {
    try {
      setLoading(true);

      // Check if dbUser and id exist
      if (!dbUser || !dbUser.id) {
        console.error("❌ Driver ID not available:", dbUser);
        toast.error("Driver information not loaded. Please refresh the page.");
        return;
      }

      console.log("🔄 Fetching vehicles for driver ID:", dbUser.id);

      const response = await fetch(
        `http://localhost:5000/api/vehicles/driver/${dbUser.id}`
      );
      const data = await response.json();

      if (response.ok) {
        setVehicles(data.vehicles);
        calculateStats(data.vehicles);
        console.log("✅ Vehicles loaded:", data.vehicles.length);
      } else {
        console.error("❌ API Error:", data);
        toast.error(data.message || "Failed to fetch vehicles");
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (vehicleList) => {
    const stats = {
      total: vehicleList.length,
      active: vehicleList.filter(
        (v) => v.availability.isActive && v.availability.isAvailable
      ).length,
      inactive: vehicleList.filter(
        (v) => !v.availability.isActive || !v.availability.isAvailable
      ).length,
      pending: vehicleList.filter((v) => v.status === "pending").length,
    };
    setStats(stats);
  };

  const toggleVehicleStatus = async (vehicleId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await fetch(
        `http://localhost:5000/api/vehicles/${vehicleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "availability.isAvailable": newStatus,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          `Vehicle ${newStatus ? "activated" : "deactivated"} successfully`
        );
        fetchMyVehicles(); // Refresh the list
      } else {
        toast.error("Failed to update vehicle status");
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error("Failed to connect to server");
    }
  };

  const deleteVehicle = async (vehicleId, vehicleName) => {
    if (
      !confirm(
        `Are you sure you want to delete ${vehicleName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/vehicles/${vehicleId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Vehicle deleted successfully");
        fetchMyVehicles(); // Refresh the list
      } else {
        toast.error("Failed to delete vehicle");
      }
    } catch (error) {
      console.error("Delete vehicle error:", error);
      toast.error("Failed to connect to server");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case "car":
        return "🚗";
      case "truck":
        return "🚛";
      case "ambulance":
        return "🚑";
      case "motorcycle":
        return "🏍️";
      case "bus":
        return "🚌";
      default:
        return "🚗";
    }
  };

  const VehicleCard = ({ vehicle }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Vehicle Image */}
      <div className="relative h-48 bg-gray-200">
        {vehicle.primaryImage ? (
          <img
            src={vehicle.primaryImage}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">{getVehicleIcon(vehicle.type)}</span>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              vehicle.status
            )}`}
          >
            {vehicle.status.toUpperCase()}
          </span>
          {vehicle.availability.isAvailable ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              ACTIVE
            </span>
          ) : (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              INACTIVE
            </span>
          )}
        </div>

        {/* Action Menu */}
        <div className="absolute top-3 right-3">
          <div className="relative group">
            <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={() => navigate(`/edit-vehicle/${vehicle._id}`)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit className="mr-3 h-4 w-4" />
                Edit Vehicle
              </button>
              <button
                onClick={() =>
                  toggleVehicleStatus(
                    vehicle._id,
                    vehicle.availability.isAvailable
                  )
                }
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {vehicle.availability.isAvailable ? (
                  <>
                    <EyeOff className="mr-3 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="mr-3 h-4 w-4" />
                    Activate
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  deleteVehicle(
                    vehicle._id,
                    `${vehicle.brand} ${vehicle.model}`
                  )
                }
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="mr-3 h-4 w-4" />
                Delete Vehicle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-gray-600">
              {vehicle.year} • {vehicle.color}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">
              ৳{vehicle.pricing.pricePerKm}/km
            </p>
            <p className="text-xs text-gray-500">
              Min: ৳{vehicle.pricing.minimumFare}
            </p>
          </div>
        </div>

        {/* Plate Number */}
        <div className="mb-2">
          <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
            {vehicle.plateNumber}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span>
            {vehicle.location.area}, {vehicle.location.city}
          </span>
        </div>

        {/* Capacity */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <Users className="h-4 w-4 mr-1" />
          <span>
            {vehicle.capacity.passengers} passengers •{" "}
            {vehicle.capacity.luggage} luggage
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {vehicle.stats.totalTrips}
            </p>
            <p className="text-xs text-gray-500">Trips</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">
              ৳{vehicle.stats.totalEarnings}
            </p>
            <p className="text-xs text-gray-500">Earned</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-lg font-bold text-gray-900 ml-1">
                {vehicle.rating.average > 0
                  ? vehicle.rating.average.toFixed(1)
                  : "0.0"}
              </span>
            </div>
            <p className="text-xs text-gray-500">Rating</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>
              Updated {new Date(vehicle.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Vehicles
            </h1>
            <p className="text-gray-600">
              Manage your vehicle listings and track performance
            </p>
          </div>
          <button
            onClick={() => navigate("/add-vehicle")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Vehicle
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
                <p className="text-gray-600 text-sm">Total Vehicles</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
                <p className="text-gray-600 text-sm">Active Vehicles</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <EyeOff className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.inactive}
                </p>
                <p className="text-gray-600 text-sm">Inactive Vehicles</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
                <p className="text-gray-600 text-sm">Pending Approval</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-16">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No vehicles found
            </h3>
            <p className="text-gray-600 mb-6">
              Start by adding your first vehicle to begin earning money
            </p>
            <button
              onClick={() => navigate("/add-vehicle")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Vehicle
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} />
            ))}
          </div>
        )}

        {/* Footer Info */}
        {vehicles.length > 0 && (
          <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Vehicle Management Tips
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • Keep your vehicle information up to date for better
                    visibility
                  </li>
                  <li>• Add high-quality photos to attract more bookings</li>
                  <li>• Maintain competitive pricing in your area</li>
                  <li>• Respond quickly to booking requests</li>
                </ul>
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  System Status: Active
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVehicles;
