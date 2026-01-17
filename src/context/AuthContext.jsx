import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Restore session on refresh
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken && storedToken.split(".").length === 3) {
      try {
        const decoded = jwtDecode(storedToken);
        setUser(decoded);
        setToken(storedToken);
      } catch {
        localStorage.removeItem("token");
      }
    }
  }, []);

  // Single entry point for auth
  const login = (jwt) => {
    localStorage.setItem("token", jwt);
    const decoded = jwtDecode(jwt);
    setUser(decoded);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
