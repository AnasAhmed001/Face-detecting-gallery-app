import { useUserContext } from "../context/UserContext";
import { Navigate } from "react-router-dom";

const RoleRedirect = () => {
  const { role } = useUserContext();

  if (!role) return <Navigate to="/login" replace />;

  return <Navigate to={role === "admin" ? "/AdminDashboard" : "/dashboard"} replace />;
};

export default RoleRedirect;
