import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Backdrop, CircularProgress } from "@mui/material";

const LoadingContext = createContext(null);

// Global "app busy" overlay. Wrap any async request with withLoading() so the
// UI is blocked (via the Backdrop capturing pointer events) until it settles.
export function LoadingProvider({ children }) {
	const [count, setCount] = useState(0);
	const countRef = useRef(0);

	const begin = useCallback(() => {
		countRef.current += 1;
		setCount(countRef.current);
	}, []);

	const end = useCallback(() => {
		countRef.current = Math.max(0, countRef.current - 1);
		setCount(countRef.current);
	}, []);

	const withLoading = useCallback(
		async (fn) => {
			begin();
			try {
				return await fn();
			} finally {
				end();
			}
		},
		[begin, end],
	);

	return (
		<LoadingContext.Provider value={{ withLoading }}>
			{children}
			<Backdrop
				open={count > 0}
				sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 1 }}
			>
				<CircularProgress color="inherit" />
			</Backdrop>
		</LoadingContext.Provider>
	);
}

export function useLoading() {
	const ctx = useContext(LoadingContext);
	if (!ctx) throw new Error("useLoading must be used within a LoadingProvider");
	return ctx;
}
