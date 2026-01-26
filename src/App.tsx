import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./store";
import { LandingPage } from "./components/LandingPage";
import { AuthCallback } from "./components/AuthCallback";
import { Dashboard } from "./components/Dashboard";
import { StandupDetail } from "./components/StandupDetail";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
	const { accessToken } = useStore();

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path="/"
					element={
						accessToken ? (
							<Navigate to="/dashboard" replace />
						) : (
							<LandingPage />
						)
					}
				/>
				<Route path="/auth/callback" element={<AuthCallback />} />
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<Dashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/standup/:id"
					element={
						<ProtectedRoute>
							<StandupDetail />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
