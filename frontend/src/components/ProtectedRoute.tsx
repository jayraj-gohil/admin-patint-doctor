import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Role } from "../types";

export function ProtectedRoute({ role }: { role: Role }) {
  const { user, token } = useAuth();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/login" replace />;

  return <Outlet />;
}
