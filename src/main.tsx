import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import { ScrollToTop } from "./components/ScrollToTop";
import { FocusOnRouteChange } from "./components/FocusOnRouteChange";
import "./index.css";

// Enable axe-core accessibility testing in development
if (import.meta.env.DEV) {
	import("@axe-core/react").then((axe) => {
		axe.default(React, ReactDOM, 1000);
	});
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<ScrollToTop />
				<FocusOnRouteChange />
				<App />
			</BrowserRouter>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	</React.StrictMode>
);