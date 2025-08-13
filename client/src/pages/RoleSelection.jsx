import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Car, DollarSign, Clock, Shield } from "lucide-react";
import toast from "react-hot-toast";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, syncWithBackend } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      id: "user",
      title: "Passenger",
      description: "Book vehicles for your transportation needs",
      icon: "🚗",
      color: "blue",
      features: [
        "Search and book vehicles",
        "Track your rides",
        "Rate and review drivers",
        "Save favorite drivers",
      ],
    },
    {
      id: "driver",
      title: "Driver",
      description: "List your vehicle and start earning money",
      icon: "👨‍💼",
      color: "green",
      features: [
        "List multiple vehicles",
        "Set your own pricing",
        "Manage bookings",
        "Track your earnings",
      ],
    },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue");
      return;
    }

    try {
      setLoading(true);

      // Sync with backend with the selected role
      await syncWithBackend(user, { role: selectedRole });

      toast.success("Role selected successfully!");

      // Navigate based on role
      if (selectedRole === "driver") {
        navigate("/add-vehicle");
      } else {
        navigate("/search");
      }
    } catch (error) {
      console.error("Role selection error:", error);
      toast.error("Failed to update role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            How do you want to use ReturnVehicle?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose your role to get started with the right features for you
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className={`relative cursor-pointer rounded-2xl p-8 transition-all duration-300 ${
                selectedRole === role.id
                  ? `ring-4 ring-${role.color}-500 bg-${role.color}-50 shadow-lg scale-105`
                  : "bg-white hover:shadow-md border border-gray-200"
              }`}
            >
              {/* Selection Indicator */}
              {selectedRole === role.id && (
                <div
                  className={`absolute -top-2 -right-2 w-8 h-8 bg-${role.color}-500 rounded-full flex items-center justify-center`}
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Role Icon */}
              <div className="text-6xl mb-6 text-center">{role.icon}</div>

              {/* Role Info */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {role.title}
                </h3>
                <p className="text-gray-600 text-lg">{role.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {role.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`w-2 h-2 bg-${role.color}-500 rounded-full mr-3`}
                    ></div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  {role.id === "user" ? (
                    <>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Quick booking
                      </div>
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        Safe rides
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Earn money
                      </div>
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-1" />
                        Flexible schedule
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Setting up your account...
              </>
            ) : (
              <>
                Continue as {selectedRole === "user" ? "Passenger" : "Driver"}
                <svg
                  className="ml-2 -mr-1 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Don't worry, you can always change your role later in your profile
            settings
          </p>
        </div>

        {/* User Info */}
        {user && (
          <div className="mt-8 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelection;
