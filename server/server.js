const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const connectDB = require("./config/db");

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const cropRoutes = require("./routes/cropRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const alertRoutes = require("./routes/alertRoutes");
const automationRoutes = require("./routes/automationRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const simulatorRoutes = require("./routes/simulatorRoutes");
const assistantRoutes = require("./routes/assistantRoutes");

const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: [
      ...env.clientUrls,
      env.simulatorUrl,
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Request Logger
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} | ${req.method} ${req.originalUrl}`
  );

  next();
});

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HydroGrow API is running",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    services: {
      api: "online",
      mongodb: "configured",
    },
  });
});

/*
|--------------------------------------------------------------------------
| API Root
|--------------------------------------------------------------------------
*/

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    name: "HydroGrow API",
    version: "1.0.0",
    message:
      "Intelligent Hydroponics Monitoring & Automation Backend",
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", cropRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/assistant", assistantRoutes);

/*
|--------------------------------------------------------------------------
| 404 + Error Handler
|--------------------------------------------------------------------------
*/

app.use(notFound);
app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.port, () => {
      console.log("");
      console.log("==========================================");
      console.log("      HYDROGROW BACKEND SERVER");
      console.log("==========================================");
      console.log(`🚀 API: http://localhost:${env.port}`);
      console.log(
        `❤️  Health: http://localhost:${env.port}/api/health`
      );
      console.log(`🌐 Frontend: ${env.clientUrl}`);
      console.log(`🎛️ Simulator: ${env.simulatorUrl}`);
      console.log("==========================================");
      console.log("");
    });
  } catch (error) {
    console.error("");
    console.error("❌ Server startup aborted.");
    console.error("Fix MongoDB Atlas configuration and try again.");
    process.exit(1);
  }
};

startServer();