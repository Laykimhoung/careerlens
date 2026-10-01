import { createContext, useState, useEffect, useCallback } from "react";
import {
  setToken,
  getToken,
  removeToken,
  setUser as saveUser,
  getUser as loadUser,
  removeUser,
} from "../utils/storage";
import { loginApi, registerApi, logoutApi } from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}