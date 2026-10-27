import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

import {
  setSession,
  clearSession,
  getStoredUser,
  getToken,
} from "../services/api";

const AuthContext = createContext(null);

const PENDING_KEY = "hydrogrow_pending_user";

const readPendingUser = () => {
  try {
    const stored = localStorage.getItem(PENDING_KEY);

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const writePendingUser = (pending) => {
  try {
    if (pending) {
      localStorage.setItem(
        PENDING_KEY,
        JSON.stringify(pending)
      );
    } else {
      localStorage.removeItem(PENDING_KEY);
    }
  } catch {
    // storage unavailable
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(Boolean(getToken()));

  /* ==================================================
     SESSION RESTORE
     ================================================== */

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.get("/auth/me");

        if (!cancelled) {
          setSession(getToken(), data.user);
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==================================================
     LOGIN
     ================================================== */

  const login = async (username, password, role = "USER") => {
    if (!username || !password) {
      return {
        success: false,
        message: "Please enter username and password.",
      };
    }

    try {
      const data = await api.post(
        "/auth/login",
        { username, password, role },
        { auth: false }
      );

      setSession(data.token, data.user);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  /* ==================================================
     REGISTER (SEND OTP)
     ================================================== */

  const register = async ({ name, username, mobile, password }) => {
    try {
      const data = await api.post(
        "/auth/register",
        { name, username, mobile, password },
        { auth: false }
      );

      writePendingUser({
        username,
        devOtp: data.devOtp || null,
      });

      return {
        success: true,
        message: data.message,
        devOtp: data.devOtp || null,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  /* ==================================================
     VERIFY OTP (AUTO SIGN-IN)
     ================================================== */

  const verifyOtp = async (otp) => {
    const pending = readPendingUser();

    if (!pending || !pending.username) {
      return {
        success: false,
        message: "Registration session expired. Please register again.",
      };
    }

    try {
      const data = await api.post(
        "/auth/verify-otp",
        { username: pending.username, otp },
        { auth: false }
      );

      setSession(data.token, data.user);
      setUser(data.user);
      writePendingUser(null);

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  /* ==================================================
     RESEND OTP
     ================================================== */

  const resendOtp = async () => {
    const pending = readPendingUser();

    if (!pending || !pending.username) {
      return {
        success: false,
        message: "Registration session expired. Please register again.",
      };
    }

    try {
      const data = await api.post(
        "/auth/resend-otp",
        { username: pending.username },
        { auth: false }
      );

      writePendingUser({
        username: pending.username,
        devOtp: data.devOtp || null,
      });

      return {
        success: true,
        message: data.message,
        devOtp: data.devOtp || null,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  /* ==================================================
     FORGOT / RESET PASSWORD
     ================================================== */

  const forgotPassword = async (username) => {
    try {
      const data = await api.post(
        "/auth/forgot-password",
        { username },
        { auth: false }
      );

      if (data.username) {
        writePendingUser({
          username: data.username,
          devOtp: data.devOtp || null,
        });
      }

      return {
        success: true,
        message: data.message,
        devOtp: data.devOtp || null,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const resetPassword = async ({ otp, password }) => {
    const pending = readPendingUser();

    if (!pending || !pending.username) {
      return {
        success: false,
        message: "Reset session expired. Start again from Forgot Password.",
      };
    }

    try {
      const data = await api.post(
        "/auth/reset-password",
        {
          username: pending.username,
          otp,
          password,
        },
        { auth: false }
      );

      writePendingUser(null);

      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  /* ==================================================
     PROFILE / SETTINGS
     ================================================== */

  const updateUserProfile = async (updates) => {
    const data = await api.put("/auth/profile", updates);

    setSession(getToken(), data.user);
    setUser(data.user);

    return data.user;
  };

  const updateUserSettings = async (settings) => {
    const data = await api.put("/auth/settings", settings);

    setSession(getToken(), data.user);
    setUser(data.user);

    return data.user;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const data = await api.put(
      "/auth/password",
      { currentPassword, newPassword }
    );

    return data.message;
  };

  /* ==================================================
     LOGOUT
     ================================================== */

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        updateUserProfile,
        updateUserSettings,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
