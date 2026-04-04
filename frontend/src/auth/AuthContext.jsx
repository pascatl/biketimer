import React, { createContext, useCallback, useContext, useState } from "react";
import {
	login as svcLogin,
	logout as svcLogout,
	getUserInfo,
	isAuthenticated,
	startAutoRefresh,
	stopAutoRefresh,
} from "./AuthService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null); // null = logged out
	const [loginOpen, setLoginOpen] = useState(true); // open immediately on load

	const login = useCallback(async (username, password) => {
		const data = await svcLogin(username, password);
		const info = getUserInfo();
		setUser(info);
		setLoginOpen(false);
		startAutoRefresh(data.expires_in, () => {
			if (isAuthenticated()) {
				setUser(getUserInfo());
			} else {
				setUser(null);
			}
		});
		return info;
	}, []);

	const logout = useCallback(() => {
		svcLogout();
		stopAutoRefresh();
		setUser(null);
	}, []);

	const openLogin = useCallback(() => setLoginOpen(true), []);
	// Can only close when already authenticated (e.g. to dismiss re-auth prompt)
	const closeLogin = useCallback(() => {
		if (user) setLoginOpen(false);
	}, [user]);

	return (
		<AuthContext.Provider
			value={{
				user,
				authenticated: !!user,
				login,
				logout,
				loginOpen,
				openLogin,
				closeLogin,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
