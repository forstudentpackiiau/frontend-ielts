import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import api from "../api/config";

const AuthContext = createContext(null);

// Token validation helper
const isTokenValid = (token) => {
  if (!token || typeof token !== "string") return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;

    // Check expiration
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }

    // Validate required fields
    if (!payload.id || !payload.username || !payload.role) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

// Decode token safely
const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      exp: payload.exp,
    };
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Logout function with cleanup
  const logout = useCallback(() => {
    try {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  // Validate and set user from token
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Validate token
    if (!isTokenValid(token)) {
      console.log("Invalid or expired token, logging out...");
      logout();
      setLoading(false);
      return;
    }

    // Decode and set user
    const userData = decodeToken(token);
    if (userData) {
      setUser(userData);
    } else {
      logout();
    }

    setLoading(false);
  }, [token, logout]);

  // Login function with validation
  const login = useCallback(async (username, password) => {
    try {
      // Client-side validation
      if (
        !username ||
        typeof username !== "string" ||
        username.trim().length < 3
      ) {
        return {
          success: false,
          message: "Username must be at least 3 characters",
        };
      }

      if (!password || typeof password !== "string" || password.length < 6) {
        return {
          success: false,
          message: "Password must be at least 6 characters",
        };
      }

      const response = await api.post("/api/auth/login", {
        username: username.trim(),
        password,
      });

      const { token: newToken, user: userData } = response.data;

      // Validate response
      if (
        !newToken ||
        !userData ||
        !userData.id ||
        !userData.username ||
        !userData.role
      ) {
        return { success: false, message: "Invalid server response" };
      }

      // Store token and set state
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, message };
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ user, login, logout, loading }),
    [user, login, logout, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
