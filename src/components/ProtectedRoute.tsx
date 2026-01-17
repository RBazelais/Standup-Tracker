import { Navigate } from "react-router-dom";
import { useStore } from "../store";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { accessToken } = useStore();

	if (!accessToken) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
}
