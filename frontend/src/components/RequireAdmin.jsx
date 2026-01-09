import { useUserContext } from "../context/UserContext";
import { Navigate } from "react-router-dom";

const RequireAdmin = ({ children }) => {
  const { role } = useUserContext();

  if (!role) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
};

export default RequireAdmin;
