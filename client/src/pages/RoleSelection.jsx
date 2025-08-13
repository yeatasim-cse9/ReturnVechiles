import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { Car, Truck, Users, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, dbUser, syncWithBackend } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      id: "user",
      title: "Passenger",
      description: "Book vehicles for your travel needs",
      icon: Users,
      features: [
        "Search and book vehicles",
        "Track your bookings",
        "Rate drivers and vehicles",
        "Secure payment system",
      ],
      color: "blue",
    },
    {
      id: "driver",
      title: "Driver",
      description: "Offer your vehicle and earn money",
      icon: Car,
      features: [
        "List your vehicles",
        "Accept booking requests",
        "Earn money from trips",
        "Manage your schedule",
      ],
      color: "green",
    },
  ];

  const handleRoleSelect = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    try {
      setLoading(true);

      // Update user role in MongoDB
      const updateData = {
        firebaseUid: user.uid,
        email: user.email,
        name: user.displayName || "User",
        role: selectedRole,
      };

      await authAPI.syncUser(updateData);

      // Re-sync with backend to get updated user data
      await syncWithBackend(user, { role: selectedRole });

      toast.success(
        `Role selected successfully! Welcome ${
          selectedRole === "driver" ? "Driver" : "Passenger"
        }!`
      );

      // Navigate to appropriate dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Role selection error:", error);
      toast.error("Failed to update role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If user already has a role, redirect to dashboard
  if (dbUser?.role && dbUser.role !== "user") {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Role
          </h1>
          <p className="text-gray-600 text-lg">
            Welcome {user?.displayName || user?.email}! How would you like to
            use ReturnVehicle?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? `border-${role.color}-500 bg-${role.color}-50 shadow-lg scale-105`
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                {isSelected && (
                  <div
                    className={`absolute top-4 right-4 text-${role.color}-500`}
                  >
                    <CheckCircle className="h-6 w-6" />
                  </div>
                )}

                <div className="text-center mb-4">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      isSelected
                        ? `bg-${role.color}-500 text-white`
                        : `bg-${role.color}-100 text-${role.color}-600`
                    }`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {role.title}
                  </h3>
                  <p className="text-gray-600">{role.description}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 text-sm">
                    Features include:
                  </h4>
                  <ul className="space-y-1">
                    {role.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start text-sm text-gray-600"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={handleRoleSelect}
            disabled={!selectedRole || loading}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              selectedRole && !loading
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading
              ? "Setting up your account..."
              : "Continue with Selected Role"}
          </button>

          <p className="text-sm text-gray-500 mt-4">
            You can change your role later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
