import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
	login as svcLogin,
	logout as svcLogout,
	getUserInfo,
	isAuthenticated,
	startAutoRefresh,
	stopAutoRefresh,
	restoreSession,
} from "./AuthService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null); // null = logged out
	const [loginOpen, setLoginOpen] = useState(false); // start closed – restore may authenticate
	const [restoring, setRestoring] = useState(true); // true while session restore is in progress

	// ── Restore session on first mount ────────────────────────
	useEffect(() => {
		restoreSession((data) => {
			if (isAuthenticated()) setUser(getUserInfo());
			else setUser(null);
		}).then((info) => {
			if (info) {
				setUser(info);
			} else {
				setLoginOpen(true); // no stored session → show login
			}
		}).catch(() => {
			setLoginOpen(true);
		}).finally(() => {
			setRestoring(false);
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const login = useCallback(async (username, password, rememberMe = true) => {
		const data = await svcLogin(username, password, rememberMe);
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
		setLoginOpen(true); // immediately show login dialog after logout
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
				restoring,
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
