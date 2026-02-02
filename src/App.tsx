import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./store";
import { LandingPage } from "./components/LandingPage";
import { AuthCallback } from "./components/AuthCallback";
import { Dashboard } from "./components/Dashboard";
import { StandupDetail } from "./components/StandupDetail";
import { StandupEdit } from "./components/StandupEdit";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

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
							<Layout>
								<Dashboard />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/standup/:id"
					element={
						<ProtectedRoute>
							<Layout>
								<StandupDetail />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/standup/:id/edit"
					element={
						<ProtectedRoute>
							<Layout>
								<StandupEdit />
							</Layout>
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
