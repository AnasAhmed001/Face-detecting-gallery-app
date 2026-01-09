import { useUserContext } from "../context/UserContext";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Sidebar from "./Sidebar";
import { useEffect } from "react";

const ProtectedRoutes = () => {
  const { user, role } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Combined navigation logic
  useEffect(() => {
    // If no authenticated role is present, redirect to login
    if (!role) {
      navigate("/login", { replace: true });
      return;
    }
  }, [role, location.pathname, navigate]);

  if (user === undefined) {
    // Still loading
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
        </div>
      </div>
    );
  }

  // Render Sidebar and children only if authenticated
  return role ? (
    <>
      <Sidebar>
        <Outlet />
      </Sidebar>
    </>
  ) : null;
};

export default ProtectedRoutes;
