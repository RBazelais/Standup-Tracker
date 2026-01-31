import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useStore } from "./store";
import { LandingPage } from "./components/LandingPage";
import { AuthCallback } from "./components/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy load heavy components
const Dashboard = lazy(() => import("./components/Dashboard").then(m => ({ default: m.Dashboard })));
const StandupDetail = lazy(() => import("./components/StandupDetail").then(m => ({ default: m.StandupDetail })));
const StandupEdit = lazy(() => import("./components/StandupEdit").then(m => ({ default: m.StandupEdit })));

function LoadingFallback() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
			<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
		</div>
	);
}

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
							<Suspense fallback={<LoadingFallback />}>
								<Dashboard />
							</Suspense>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/standup/:id"
					element={
						<ProtectedRoute>
							<Suspense fallback={<LoadingFallback />}>
								<StandupDetail />
							</Suspense>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/standup/:id/edit"
					element={
						<ProtectedRoute>
							<Suspense fallback={<LoadingFallback />}>
								<StandupEdit />
							</Suspense>
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
