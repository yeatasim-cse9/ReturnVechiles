import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import RoleSelection from "./pages/RoleSelection";
import VehicleSearch from "./pages/VehicleSearch";
import AddVehicle from "./pages/AddVehicle";
import MyVehicles from "./pages/MyVehicles";
import MyBookings from "./pages/MyBookings";

function App() {
  const { user, dbUser, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/role-selection"
          element={
            <ProtectedRoute>
              <RoleSelection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <VehicleSearch />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-vehicle"
          element={
            <ProtectedRoute>
              <AddVehicle />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-vehicles"
          element={
            <ProtectedRoute>
              <MyVehicles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    {dbUser?.role === "driver"
                      ? "Driver Dashboard"
                      : dbUser?.role === "admin"
                      ? "Admin Dashboard"
                      : "User Dashboard"}
                  </h1>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-3">
                        Account Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Name:</strong> {dbUser?.name}
                        </p>
                        <p>
                          <strong>Email:</strong> {dbUser?.email}
                        </p>
                        <p>
                          <strong>Phone:</strong>{" "}
                          {dbUser?.phone || "Not provided"}
                        </p>
                        <p>
                          <strong>Role:</strong>
                          <span
                            className={`ml-2 px-2 py-1 rounded text-xs ${
                              dbUser?.role === "admin"
                                ? "bg-red-100 text-red-800"
                                : dbUser?.role === "driver"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {dbUser?.role?.toUpperCase()}
                          </span>
                        </p>
                        <p>
                          <strong>Status:</strong>
                          <span
                            className={`ml-2 px-2 py-1 rounded text-xs ${
                              dbUser?.isVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {dbUser?.isVerified
                              ? "Verified"
                              : "Pending Verification"}
                          </span>
                        </p>
                        <p>
                          <strong>Member Since:</strong>
                          <span className="ml-1 text-gray-600">
                            {dbUser?.createdAt
                              ? new Date(dbUser.createdAt).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-3">
                        Quick Actions
                      </h3>
                      <div className="space-y-2">
                        {dbUser?.role === "driver" ? (
                          <>
                            <a
                              href="/add-vehicle"
                              className="block w-full text-left px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Add New Vehicle
                            </a>
                            <a
                              href="/my-vehicles"
                              className="block w-full text-left px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              My Vehicles
                            </a>
                            <button className="w-full text-left px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                              View Bookings
                            </button>
                            <button className="w-full text-left px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors">
                              Earnings Report
                            </button>
                          </>
                        ) : dbUser?.role === "admin" ? (
                          <>
                            <button className="w-full text-left px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                              Manage Users
                            </button>
                            <button className="w-full text-left px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors">
                              Verify Drivers
                            </button>
                            <button className="w-full text-left px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                              Vehicle Approvals
                            </button>
                            <button className="w-full text-left px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                              System Reports
                            </button>
                          </>
                        ) : (
                          <>
                            <a
                              href="/search"
                              className="block w-full text-left px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Search Vehicles
                            </a>
                            <a
                              href="/my-bookings"
                              className="block w-full text-left px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              My Bookings
                            </a>
                            <button className="w-full text-left px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                              Booking History
                            </button>
                            <button className="w-full text-left px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                              Favorites
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statistics Section */}
                  {dbUser?.role === "driver" && (
                    <div className="mt-8 grid md:grid-cols-4 gap-4">
                      <div className="bg-blue-100 p-4 rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-blue-700">0</h4>
                        <p className="text-blue-600 text-sm">Vehicles Listed</p>
                      </div>
                      <div className="bg-green-100 p-4 rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-green-700">0</h4>
                        <p className="text-green-600 text-sm">Total Bookings</p>
                      </div>
                      <div className="bg-yellow-100 p-4 rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-yellow-700">
                          ৳0
                        </h4>
                        <p className="text-yellow-600 text-sm">
                          Total Earnings
                        </p>
                      </div>
                      <div className="bg-purple-100 p-4 rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-purple-700">
                          0.0
                        </h4>
                        <p className="text-purple-600 text-sm">
                          Average Rating
                        </p>
                      </div>
                    </div>
                  )}

                  {dbUser?.role === "user" && (
                    <div className="mt-8 grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-100 p-4 rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-blue-700">0</h4>
                        <p className="text-blue-600 text-sm">Total Bookings</p>
                      </div>
                      <div className="bg-green-100 p-4 rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-green-700">0</h4>
                        <p className="text-green-600 text-sm">
                          Completed Trips
                        </p>
                      </div>
                      <div className="bg-purple-100 p-4 rounded-lg text-center">
                        <h4 className="text-2xl font-bold text-purple-700">
                          ৳0
                        </h4>
                        <p className="text-purple-600 text-sm">Money Saved</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">System Status:</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center text-sm text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Firebase Connected
                          </span>
                          <span className="flex items-center text-sm text-blue-600">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            MongoDB Synced
                          </span>
                          <span className="flex items-center text-sm text-purple-600">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                            API Connected
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={logout}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <div className="container mx-auto px-4 py-16">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-5xl font-bold text-gray-900 mb-6">
                  Welcome to{" "}
                  <span className="text-blue-600">ReturnVehicle</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Your trusted vehicle sharing platform for convenient and
                  affordable transportation
                </p>

                {user ? (
                  <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👋</span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Welcome back, {dbUser?.name || user.displayName}!
                    </h2>
                    {dbUser?.role && (
                      <p className="text-gray-600 mb-6">
                        You're logged in as a{" "}
                        <span className="font-semibold text-blue-600">
                          {dbUser.role}
                        </span>
                      </p>
                    )}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      {dbUser?.role === "driver" ? (
                        <>
                          <a
                            href="/add-vehicle"
                            className="block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Add Vehicle
                          </a>
                          <a
                            href="/my-vehicles"
                            className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            My Vehicles
                          </a>
                          <a
                            href="/search"
                            className="block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                          >
                            Browse Vehicles
                          </a>
                        </>
                      ) : (
                        <>
                          <a
                            href="/search"
                            className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Search Vehicles
                          </a>
                          <a
                            href="/dashboard"
                            className="block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Dashboard
                          </a>
                          <a
                            href="/my-bookings"
                            className="block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                          >
                            My Bookings
                          </a>
                        </>
                      )}
                    </div>

                    {/* Quick Stats for logged in users */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            {dbUser?.role === "driver" ? "0" : "0"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {dbUser?.role === "driver" ? "Vehicles" : "Trips"}
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            ৳0
                          </p>
                          <p className="text-sm text-gray-600">
                            {dbUser?.role === "driver" ? "Earned" : "Spent"}
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            5.0
                          </p>
                          <p className="text-sm text-gray-600">Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                      <div className="text-center p-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">🚗</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          Book Vehicles
                        </h3>
                        <p className="text-gray-600">
                          Find and book cars, trucks, or ambulances for your
                          journey
                        </p>
                      </div>
                      <div className="text-center p-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">💰</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          Earn Money
                        </h3>
                        <p className="text-gray-600">
                          List your vehicle and earn money by providing rides
                        </p>
                      </div>
                      <div className="text-center p-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">🛡️</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          Safe & Secure
                        </h3>
                        <p className="text-gray-600">
                          Verified drivers and secure payment system
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <a
                        href="/register"
                        className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg mr-4"
                      >
                        Get Started
                      </a>
                      <a
                        href="/login"
                        className="inline-block bg-white text-blue-600 border border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium text-lg"
                      >
                        Sign In
                      </a>
                    </div>

                    {/* Features Showcase */}
                    <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">🔍</span>
                        </div>
                        <h4 className="font-semibold mb-2">Advanced Search</h4>
                        <p className="text-sm text-gray-600">
                          Filter by type, location, price, and features
                        </p>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">⭐</span>
                        </div>
                        <h4 className="font-semibold mb-2">Rating System</h4>
                        <p className="text-sm text-gray-600">
                          Rate and review drivers and vehicles
                        </p>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">💳</span>
                        </div>
                        <h4 className="font-semibold mb-2">Secure Payment</h4>
                        <p className="text-sm text-gray-600">
                          Safe and secure payment processing
                        </p>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">📱</span>
                        </div>
                        <h4 className="font-semibold mb-2">24/7 Support</h4>
                        <p className="text-sm text-gray-600">
                          Round-the-clock customer support
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
