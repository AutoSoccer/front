"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { LoginFormInputs, RegisterFormInputs } from "@/lib/schemas/auth";
import { authService } from "@/services/authService";
import type { User } from "@/types/user";

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormInputs) => Promise<void>;
  register: (data: RegisterFormInputs) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    authService
      .getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(
    async (data: LoginFormInputs) => {
      const response = await authService.login(data);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setUser(response.user);
      router.push("/");
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterFormInputs) => {
      await authService.register(data);
      router.push("/auth/login");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/auth/login");
  }, [router]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
