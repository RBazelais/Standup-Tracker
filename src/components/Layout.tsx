import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<Header />
			<main className="flex-1">{children}</main>
			<Footer />
		</div>
	);
}
