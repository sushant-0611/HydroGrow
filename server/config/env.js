const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 5000,

  mongodbUri: process.env.MONGODB_URI,

  jwtSecret:
    process.env.JWT_SECRET || "hydrogrow_development_secret_change_this",

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  simulatorUrl: process.env.SIMULATOR_URL || "http://localhost:5174",
};

env.isDevelopment = env.nodeEnv === "development";

env.clientUrls = env.clientUrl
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

if (!env.mongodbUri) {
  console.warn("⚠️ MONGODB_URI is not configured.");
}

module.exports = env;