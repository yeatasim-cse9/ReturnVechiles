import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MapPin,
  Star,
  Users,
  Car,
  Truck,
  Ambulance,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const VehicleSearch = () => {
  const { user, dbUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    city: "",
    area: "",
    minPrice: "",
    maxPrice: "",
    capacity: "",
    features: [],
    sortBy: "rating.average",
    sortOrder: -1,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [filterOptions, setFilterOptions] = useState({
    vehicleTypes: [],
    cities: [],
    features: [],
    priceRange: { minPrice: 0, maxPrice: 100 },
  });

  // Fetch filter options on component mount
  useEffect(() => {
    fetchFilterOptions();
    fetchVehicles();
  }, []);

  // Fetch vehicles when filters change
  useEffect(() => {
    fetchVehicles();
  }, [filters, pagination.currentPage]);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/vehicles/meta/filters"
      );
      const data = await response.json();

      if (response.ok) {
        setFilterOptions(data.filters);
      }
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams();

      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "" && value.length !== 0) {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(","));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      queryParams.append("page", pagination.currentPage);
      queryParams.append("limit", 12);

      const response = await fetch(
        `http://localhost:5000/api/vehicles?${queryParams}`
      );
      const data = await response.json();

      if (response.ok) {
        setVehicles(data.vehicles);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch vehicles");
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleFeatureToggle = (feature) => {
    setFilters((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      city: "",
      area: "",
      minPrice: "",
      maxPrice: "",
      capacity: "",
      features: [],
      sortBy: "rating.average",
      sortOrder: -1,
    });
    setSearchQuery("");
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case "car":
        return <Car className="h-5 w-5" />;
      case "truck":
        return <Truck className="h-5 w-5" />;
      case "ambulance":
        return <Ambulance className="h-5 w-5" />;
      default:
        return <Car className="h-5 w-5" />;
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
            {getVehicleIcon(vehicle.type)}
            <span className="ml-2 text-lg">No Image</span>
          </div>
        )}

        {/* Vehicle Type Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
              vehicle.type === "car"
                ? "bg-blue-500"
                : vehicle.type === "truck"
                ? "bg-green-500"
                : vehicle.type === "ambulance"
                ? "bg-red-500"
                : "bg-gray-500"
            }`}
          >
            {vehicle.type.toUpperCase()}
          </span>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 font-medium">
              {vehicle.rating.average > 0
                ? vehicle.rating.average.toFixed(1)
                : "New"}
            </span>
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
          <span>{vehicle.capacity.passengers} passengers</span>
        </div>

        {/* Features */}
        {vehicle.features.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {vehicle.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                >
                  {feature}
                </span>
              ))}
              {vehicle.features.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                  +{vehicle.features.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Driver Info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {vehicle.driver.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-900">
                {vehicle.driver.name}
              </p>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-600 ml-1">
                  {vehicle.driver.rating?.average > 0
                    ? vehicle.driver.rating.average.toFixed(1)
                    : "New"}
                </span>
              </div>
            </div>
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Book Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Find Your Perfect Vehicle
              </h1>
              <p className="text-gray-600">
                Discover and book vehicles for your journey
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {pagination.totalCount} vehicles available
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by brand, model, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                showFilters
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-5 w-5 inline mr-2" />
              Filters
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                {/* Vehicle Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {filterOptions.vehicleTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Cities</option>
                    {filterOptions.cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Passengers
                  </label>
                  <select
                    value={filters.capacity}
                    onChange={(e) =>
                      handleFilterChange("capacity", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="2">2+</option>
                    <option value="4">4+</option>
                    <option value="6">6+</option>
                    <option value="8">8+</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="rating.average">Rating</option>
                    <option value="pricing.pricePerKm">
                      Price (Low to High)
                    </option>
                    <option value="createdAt">Newest First</option>
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Price (৳/km)
                  </label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price (৳/km)
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.features.map((feature) => (
                    <button
                      key={feature}
                      onClick={() => handleFeatureToggle(feature)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.features.includes(feature)
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="container mx-auto px-4 py-8">
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
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria
            </p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Vehicle Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle._id} vehicle={vehicle} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage - 1,
                    }))
                  }
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage + 1,
                    }))
                  }
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VehicleSearch;
