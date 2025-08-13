import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Car, Upload, MapPin, DollarSign, Settings, Save } from "lucide-react";
import toast from "react-hot-toast";

const AddVehicle = () => {
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Information
    type: "car",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    plateNumber: "",
    color: "",

    // Capacity & Features
    capacity: {
      passengers: 4,
      luggage: "medium",
    },
    features: [],

    // Pricing
    pricing: {
      basePrice: 100,
      pricePerKm: 15,
      pricePerHour: 200,
      minimumFare: 150,
    },

    // Location
    location: {
      city: "",
      area: "",
      coordinates: {
        latitude: 23.8103,
        longitude: 90.4125,
      },
      address: "",
    },

    // Description
    description: "",
  });

  // Check if user is a driver
  if (!dbUser || dbUser.role !== "driver") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">Only drivers can add vehicles.</p>
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

  const vehicleTypes = [
    { value: "car", label: "Car", icon: "🚗" },
    { value: "truck", label: "Truck", icon: "🚛" },
    { value: "ambulance", label: "Ambulance", icon: "🚑" },
    { value: "motorcycle", label: "Motorcycle", icon: "🏍️" },
    { value: "bus", label: "Bus", icon: "🚌" },
  ];

  const availableFeatures = [
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
  ];

  const luggageOptions = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
    { value: "extra-large", label: "Extra Large" },
  ];

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleBasicChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.brand ||
      !formData.model ||
      !formData.plateNumber ||
      !formData.color
    ) {
      toast.error("Please fill in all basic information fields");
      return;
    }

    if (!formData.location.city || !formData.location.area) {
      toast.error("Please provide location information");
      return;
    }

    // Check driver ID availability
    if (!dbUser || !dbUser.id) {
      toast.error(
        "Driver information not loaded. Please refresh and try again."
      );
      return;
    }

    try {
      setLoading(true);

      const vehicleData = {
        ...formData,
        driver: dbUser.id, // Use normalized ID
        plateNumber: formData.plateNumber.toUpperCase(),
      };

      console.log("🚗 Adding vehicle with driver ID:", dbUser.id);

      const response = await fetch("http://localhost:5000/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Vehicle added successfully!");
        navigate("/my-vehicles");
      } else {
        console.error("❌ Add vehicle error:", data);
        toast.error(data.message || "Failed to add vehicle");
      }
    } catch (error) {
      console.error("Add vehicle error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Add New Vehicle
              </h1>
              <p className="text-gray-600">
                List your vehicle and start earning money
              </p>
            </div>
            <Car className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Basic Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {vehicleTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleBasicChange("type", type.value)}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        formData.type === type.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand & Model */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => handleBasicChange("brand", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Toyota, Ford, Honda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => handleBasicChange("model", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Corolla, F-150, Civic"
                  />
                </div>
              </div>

              {/* Year & Plate Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  required
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) =>
                    handleBasicChange("year", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.plateNumber}
                  onChange={(e) =>
                    handleBasicChange(
                      "plateNumber",
                      e.target.value.toUpperCase()
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., DHK-METRO-11-1234"
                />
              </div>

              {/* Color */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color *
                </label>
                <input
                  type="text"
                  required
                  value={formData.color}
                  onChange={(e) => handleBasicChange("color", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., White, Black, Silver"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Capacity & Features
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Passenger Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passenger Capacity *
                </label>
                <select
                  value={formData.capacity.passengers}
                  onChange={(e) =>
                    handleInputChange(
                      "capacity",
                      "passengers",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[...Array(20)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} passenger{i > 0 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Luggage Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Luggage Capacity
                </label>
                <select
                  value={formData.capacity.luggage}
                  onChange={(e) =>
                    handleInputChange("capacity", "luggage", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {luggageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vehicle Features
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableFeatures.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => handleFeatureToggle(feature)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      formData.features.includes(feature)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 rounded border mr-3 ${
                          formData.features.includes(feature)
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.features.includes(feature) && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Pricing Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.pricing.basePrice}
                  onChange={(e) =>
                    handleInputChange(
                      "pricing",
                      "basePrice",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Starting fare for any trip
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per KM (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.pricing.pricePerKm}
                  onChange={(e) =>
                    handleInputChange(
                      "pricing",
                      "pricePerKm",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Per kilometer charge
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Hour (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.pricing.pricePerHour}
                  onChange={(e) =>
                    handleInputChange(
                      "pricing",
                      "pricePerHour",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hourly rate for time-based bookings
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Fare (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.pricing.minimumFare}
                  onChange={(e) =>
                    handleInputChange(
                      "pricing",
                      "minimumFare",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum amount to charge
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location.city}
                  onChange={(e) =>
                    handleInputChange("location", "city", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dhaka, Chittagong, Sylhet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location.area}
                  onChange={(e) =>
                    handleInputChange("location", "area", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Gulshan, Dhanmondi, Uttara"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Address
                </label>
                <textarea
                  rows="3"
                  value={formData.location.address}
                  onChange={(e) =>
                    handleInputChange("location", "address", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Complete address for better findability (optional)"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Additional Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Description
              </label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) =>
                  handleBasicChange("description", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your vehicle, its condition, special features, or any additional information..."
                maxLength="500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ready to List Your Vehicle?
                </h3>
                <p className="text-sm text-gray-600">
                  Your vehicle will be reviewed before being approved for
                  bookings.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {loading ? "Adding Vehicle..." : "Add Vehicle"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
