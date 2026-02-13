import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-accent focus:text-white focus:top-2 focus:left-2 focus:rounded-md"
			>
				Skip to main content
			</a>
			<Header />
			<div id="main-content" className="flex-1">
				{children}
			</div>
			<Footer />
		</div>
	);
}
