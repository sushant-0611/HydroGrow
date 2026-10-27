const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");

const forward = async (path, options = {}) => {
  let response;

  try {
    response = await fetch(`${env.simulatorUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new ApiError(
      502,
      "Simulator service is unreachable. Start the simulator app (port 5174)."
    );
  }

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { status: response.status, data };
};

const proxyStatus = asyncHandler(async (req, res) => {
  const { status, data } = await forward("/api/status");

  res.status(status).json(data);
});

const proxyReadings = asyncHandler(async (req, res) => {
  const { status, data } = await forward("/api/readings");

  res.status(status).json(data);
});

const proxyHistory = asyncHandler(async (req, res) => {
  const params = new URLSearchParams();

  if (req.query.range) {
    params.set("range", req.query.range);
  }

  const query = params.toString();

  const { status, data } = await forward(
    `/api/history${query ? `?${query}` : ""}`
  );

  res.status(status).json(data);
});

const proxyControl = asyncHandler(async (req, res) => {
  const { status, data } = await forward("/api/control", {
    method: "POST",
    body: JSON.stringify(req.body || {}),
  });

  res.status(status).json(data);
});

module.exports = {
  proxyStatus,
  proxyReadings,
  proxyHistory,
  proxyControl,
};
