import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {
  deviceApiMiddleware,
  startDeviceUnit,
} from "./device/deviceServer.js";

/* =========================================================
   HYDROGROW INPUT SIMULATOR
   Runs as a standalone "hardware sensor unit" on port 5174.
   The device API lives in the dev-server (Node) process, so
   device state survives browser refreshes and can be polled
   by the HydroGrow client on a different port.
   ========================================================= */

function hydrogrowDeviceUnit() {
  return {
    name: "hydrogrow-device-unit",
    configureServer(server) {
      startDeviceUnit();
      server.middlewares.use(deviceApiMiddleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), hydrogrowDeviceUnit()],
  server: {
    port: 5174,
    host: "localhost",
  },
});
