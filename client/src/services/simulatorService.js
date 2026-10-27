/* =========================================================
   HYDROGROW SENSOR HARDWARE UNIT — CLIENT API

   Talks to the CORS-enabled device API exposed by the
   simulator dev server on port 5174
   (simulator-app/device/deviceServer.js).
   ========================================================= */

export const DEVICE_ID = "HYDROGROW-SIM-001";

const DEVICE_URL_STORAGE_KEY = "hydrogrow_device_url";

const DEFAULT_DEVICE_URL = "http://localhost:5174";

const REQUEST_TIMEOUT_MS = 3000;

export function getDeviceUrl() {
  const stored = localStorage.getItem(DEVICE_URL_STORAGE_KEY);

  return stored || DEFAULT_DEVICE_URL;
}

export function setDeviceUrl(url) {
  if (url) {
    localStorage.setItem(DEVICE_URL_STORAGE_KEY, String(url).replace(/\/+$/, ""));
  } else {
    localStorage.removeItem(DEVICE_URL_STORAGE_KEY);
  }
}

async function deviceRequest(path, options = {}) {
  const hasBody = options.body !== undefined;

  const response = await fetch(`${getDeviceUrl()}${path}`, {
    method: options.method || "GET",

    headers: hasBody
      ? { "Content-Type": "application/json" }
      : undefined,

    body: options.body,

    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Device responded with ${response.status}`);
  }

  return response.json();
}

export function getDeviceStatus() {
  return deviceRequest("/api/status");
}

export function getDeviceReadings() {
  return deviceRequest("/api/readings");
}

export function getDeviceHistory(limit = 100) {
  return deviceRequest(`/api/history?limit=${limit}`);
}

export function sendDeviceControl(control) {
  return deviceRequest("/api/control", {
    method: "POST",

    body: JSON.stringify(control),
  });
}
