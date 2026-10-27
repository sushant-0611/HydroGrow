const API_BASE = "/api";

const TOKEN_KEY = "hydrogrow_token";
const USER_KEY = "hydrogrow_user";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
};

export const setSession = (token, user) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // storage unavailable
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // storage unavailable
  }
};

export const getStoredUser = () => {
  try {
    const stored = localStorage.getItem(USER_KEY);

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const request = async (path, { method = "GET", body, auth = true } = {}) => {
  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Cannot reach the HydroGrow server. Is the backend running on port 5000?"
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearSession();
    }

    const error = new Error(
      (data && data.message) || `Request failed (${response.status}).`
    );

    error.status = response.status;
    throw error;
  }

  return data;
};

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),

  post: (path, body, options) =>
    request(path, { ...options, method: "POST", body }),

  put: (path, body, options) =>
    request(path, { ...options, method: "PUT", body }),

  patch: (path, body, options) =>
    request(path, { ...options, method: "PATCH", body }),

  del: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export default api;
