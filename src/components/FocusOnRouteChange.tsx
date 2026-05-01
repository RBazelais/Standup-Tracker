import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function FocusOnRouteChange() {
	const { pathname } = useLocation();
	const prevPathnameRef = useRef(pathname);

	useEffect(() => {
		const prev = prevPathnameRef.current;
		prevPathnameRef.current = pathname;
		if (prev === pathname) return;
		document.getElementById('main-content')?.focus();
	}, [pathname]);

	return null;
}