import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

export interface AuthState { user: User | null; loading: boolean; }
const AuthContext = createContext<AuthState>({ user: null, loading: true });
export function AuthProvider({ value, children }: { value: AuthState; children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);