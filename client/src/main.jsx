import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./assets/styles/theme.css";
import "./index.css";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { CropProvider } from "./context/CropContext";
import { SensorProvider } from "./context/SensorContext";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>

      <AuthProvider>

        <CropProvider>

          <SensorProvider>

            <App />

          </SensorProvider>

        </CropProvider>

      </AuthProvider>

    </BrowserRouter>
  </React.StrictMode>
);