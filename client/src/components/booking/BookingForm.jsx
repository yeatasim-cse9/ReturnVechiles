import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { bookingAPI } from "../../services/api";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  Phone,
  Car,
  Navigation,
  CreditCard,
  Wallet,
  Banknote,
} from "lucide-react";
import toast from "react-hot-toast";

const BookingForm = ({ vehicle, onClose }) => {
  const { dbUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(null);

  const [formData, setFormData] = useState({
    pickupLocation: {
      address: "",
      coordinates: {
        latitude: 23.8103,
        longitude: 90.4125,
      },
    },
    dropoffLocation: {
      address: "",
      coordinates: {
        latitude: 23.8103,
        longitude: 90.4125,
      },
    },
    distance: 0,
    estimatedDuration: 0,
    scheduledDateTime: "",
    specialRequests: "",
    paymentMethod: "cash",
  });

  const paymentMethods = [
    {
      value: "cash",
      label: "Cash Payment",
      icon: <Banknote className="h-4 w-4" />,
    },
    {
      value: "card",
      label: "Credit/Debit Card",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      value: "mobile_banking",
      label: "Mobile Banking",
      icon: <Phone className="h-4 w-4" />,
    },
    {
      value: "wallet",
      label: "Digital Wallet",
      icon: <Wallet className="h-4 w-4" />,
    },
  ];

  // Calculate minimum date/time (current time + 30 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  // Calculate distance and duration (mock implementation)
  const calculateRoute = () => {
    if (!formData.pickupLocation.address || !formData.dropoffLocation.address) {
      return;
    }

    // Mock calculation - in real app, use Google Maps Distance Matrix API
    const mockDistance = Math.random() * 20 + 5; // 5-25 km
    const mockDuration = mockDistance * 3 + Math.random() * 20; // rough estimate

    setFormData((prev) => ({
      ...prev,
      distance: parseFloat(mockDistance.toFixed(1)),
      estimatedDuration: Math.round(mockDuration),
    }));
  };

  // Calculate price when distance/duration changes
  useEffect(() => {
    if (formData.distance > 0 && formData.estimatedDuration > 0) {
      calculatePrice();
    }
  }, [formData.distance, formData.estimatedDuration]);

  const calculatePrice = async () => {
    try {
      setPriceLoading(true);
      const response = await bookingAPI.calculateBookingPrice(
        vehicle._id,
        formData.distance,
        formData.estimatedDuration
      );
      setCalculatedPrice(response.pricing);
    } catch (error) {
      console.error("Price calculation error:", error);
      toast.error("Failed to calculate price");
    } finally {
      setPriceLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationChange = (type, address) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        address,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.pickupLocation.address || !formData.dropoffLocation.address) {
      toast.error("Please enter pickup and dropoff locations");
      return;
    }

    if (!formData.scheduledDateTime) {
      toast.error("Please select date and time for your trip");
      return;
    }

    if (formData.distance <= 0) {
      toast.error("Please calculate route distance");
      return;
    }

    if (!dbUser || !dbUser.id) {
      toast.error("User information not available. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const bookingData = {
        vehicleId: vehicle._id,
        userId: dbUser.id,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
        distance: formData.distance,
        estimatedDuration: formData.estimatedDuration,
        scheduledDateTime: formData.scheduledDateTime,
        specialRequests: formData.specialRequests,
        paymentMethod: formData.paymentMethod,
      };

      const response = await bookingAPI.createBooking(bookingData);

      toast.success("Booking request sent successfully!");

      // Navigate to bookings page
      navigate("/my-bookings");

      // Close modal if provided
      if (onClose) onClose();
    } catch (error) {
      console.error("Booking error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to create booking. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Book Vehicle</h2>
            <p className="text-blue-100">Complete your booking details</p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-blue-100 mb-1">
              <Car className="h-4 w-4 mr-1" />
              <span className="text-sm">
                {vehicle.brand} {vehicle.model}
              </span>
            </div>
            <div className="text-sm text-blue-200">{vehicle.plateNumber}</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Trip Locations */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Pickup Location *
            </label>
            <input
              type="text"
              required
              value={formData.pickupLocation.address}
              onChange={(e) =>
                handleLocationChange("pickupLocation", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pickup address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Navigation className="h-4 w-4 inline mr-1" />
              Dropoff Location *
            </label>
            <input
              type="text"
              required
              value={formData.dropoffLocation.address}
              onChange={(e) =>
                handleLocationChange("dropoffLocation", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter dropoff address"
            />
          </div>
        </div>

        {/* Calculate Route Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={calculateRoute}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Calculate Route & Distance
          </button>
        </div>

        {/* Route Information */}
        {formData.distance > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              Route Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Distance:</span>
                <span className="ml-2 font-medium">{formData.distance} km</span>
              </div>
              <div>
                <span className="text-gray-600">Estimated Duration:</span>
                <span className="ml-2 font-medium">
                  {formData.estimatedDuration} minutes
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Date & Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Schedule Date & Time *
          </label>
          <input
            type="datetime-local"
            required
            min={getMinDateTime()}
            value={formData.scheduledDateTime}
            onChange={(e) =>
              handleInputChange("scheduledDateTime", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum booking time is 30 minutes from now
          </p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <label key={method.value} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={formData.paymentMethod === method.value}
                  onChange={(e) =>
                    handleInputChange("paymentMethod", e.target.value)
                  }
                  className="sr-only"
                />
                <div
                  className={`p-3 border-2 rounded-lg transition-colors ${
                    formData.paymentMethod === method.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    {method.icon}
                    <span className="ml-2 text-sm font-medium">
                      {method.label}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests (Optional)
          </label>
          <textarea
            rows="3"
            value={formData.specialRequests}
            onChange={(e) =>
              handleInputChange("specialRequests", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special requirements or notes for the driver..."
            maxLength="500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.specialRequests.length}/500 characters
          </p>
        </div>

        {/* Price Display */}
        {calculatedPrice && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Trip Cost Breakdown
            </h3>

            {priceLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-blue-600">Calculating price...</span>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price:</span>
                  <span className="font-medium">
                    ৳{calculatedPrice.basePrice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Distance ({formData.distance} km):
                  </span>
                  <span className="font-medium">
                    ৳{calculatedPrice.distancePrice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Time ({Math.round(formData.estimatedDuration / 60)} hrs):
                  </span>
                  <span className="font-medium">
                    ৳{calculatedPrice.timePrice}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-900">
                      Total Amount:
                    </span>
                    <span className="font-bold text-lg text-blue-600">
                      ৳{calculatedPrice.totalPrice}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Driver Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">
            Driver Information
          </h3>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">{vehicle.driver.name}</p>
              <div className="flex items-center text-sm text-gray-600">
                <span className="flex items-center">
                  ⭐{" "}
                  {vehicle.driver.rating?.average > 0
                    ? vehicle.driver.rating.average.toFixed(1)
                    : "New"}
                </span>
                <span className="mx-2">•</span>
                <span>{vehicle.driver.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !calculatedPrice}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Booking...
              </>
            ) : (
              <>
                <Car className="h-5 w-5 mr-2" />
                Confirm Booking
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
