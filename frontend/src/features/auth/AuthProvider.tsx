"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api/error";
import { loginRequest, registerRequest } from "./api";
import { restoreStoredSession, verifySession } from "./session";
import { clearToken, setToken, STORAGE_ERROR_MESSAGE } from "./storage";
import type { AuthState, ResolvedAuthState } from "./types";

interface AuthContextValue {
  state: AuthState;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const activeRequest = useRef<AbortController | null>(null);

  const beginRequest = useCallback(() => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    return controller;
  }, []);

  const commitSession = useCallback((next: ResolvedAuthState, controller: AbortController) => {
    if (controller.signal.aborted || activeRequest.current !== controller) return;
    if (next.status === "unauthenticated") {
      try {
        clearToken();
      } catch {
        setState({ status: "error", message: STORAGE_ERROR_MESSAGE });
        return;
      }
    }
    setState(next);
  }, []);

  useEffect(() => {
    const controller = beginRequest();
    // Initial loading is already set. Commit only the async session result.
    void restoreStoredSession(controller.signal).then((next) => commitSession(next, controller));
    return () => { activeRequest.current?.abort(); };
  }, [beginRequest, commitSession]);

  const refreshSession = useCallback(async () => {
    const controller = beginRequest();
    setState({ status: "loading" });
    const next = await restoreStoredSession(controller.signal);
    commitSession(next, controller);
  }, [beginRequest, commitSession]);

  const authenticate = useCallback(async (request: (signal: AbortSignal) => Promise<string>) => {
    const controller = beginRequest();
    try {
      const token = await request(controller.signal);
      if (controller.signal.aborted) return;
      try {
        setToken(token);
      } catch {
        setState({ status: "error", message: STORAGE_ERROR_MESSAGE });
        return;
      }
      const next = await verifySession(token, controller.signal);
      commitSession(next, controller);
      if (!controller.signal.aborted && next.status === "unauthenticated") {
        throw new ApiError(401, "Your session could not be verified. Please log in again.");
      }
    } catch (error: unknown) {
      if (!controller.signal.aborted) throw error;
    }
  }, [beginRequest, commitSession]);

  const login = useCallback((identifier: string, password: string) => (
    authenticate((signal) => loginRequest(identifier, password, signal))
  ), [authenticate]);

  const register = useCallback((username: string, email: string, password: string) => (
    authenticate((signal) => registerRequest(username, email, password, signal))
  ), [authenticate]);

  const logout = useCallback(() => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    try {
      clearToken();
      setState({ status: "unauthenticated" });
    } catch {
      // Do not claim logout succeeded if the persisted session could not be removed.
      setState({ status: "error", message: STORAGE_ERROR_MESSAGE });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, register, refreshSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
