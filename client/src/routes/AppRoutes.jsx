import { Routes, Route, Link } from "react-router-dom";

/* =====================================================
   LAYOUTS
   ===================================================== */

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

/* =====================================================
   PUBLIC PAGES
   ===================================================== */

import Home from "../pages/public/Home";
import About from "../pages/public/About";
import Features from "../pages/public/Features";
import HowItWorks from "../pages/public/HowItWorks";
import Crops from "../pages/public/Crops";
import Contact from "../pages/public/Contact";

/* =====================================================
   AUTH PAGES
   ===================================================== */

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyOTP from "../pages/auth/VerifyOTP";
import ForgotPassword from "../pages/auth/ForgotPassword";

/* =====================================================
   DASHBOARD PAGES
   ===================================================== */

import Dashboard from "../pages/dashboard/Dashboard";
import Monitoring from "../pages/dashboard/Monitoring";
import Alerts from "../pages/dashboard/Alerts";
import SensorHistory from "../pages/dashboard/SensorHistory";

/* =====================================================
   FARM PAGES
   ===================================================== */

import MyFarm from "../pages/farm/MyFarm";

/* =====================================================
   CROP PAGES
   ===================================================== */

import CropSelection from "../pages/crops/CropSelection";
import CropDetails from "../pages/crops/CropDetails";
import CropSchedule from "../pages/crops/CropSchedule";
import GrowthTracking from "../pages/crops/GrowthTracking";

/* =====================================================
   AUTOMATION
   ===================================================== */

import Automation from "../pages/automation/Automation";

/* =====================================================
   MARKETPLACE
   ===================================================== */

import Marketplace from "../pages/marketplace/Marketplace";
import MyListings from "../pages/marketplace/MyListings";
import Orders from "../pages/marketplace/Orders";

/* =====================================================
   AUTH PROTECTION
   ===================================================== */

import ProtectedRoute from "../components/common/ProtectedRoute";
import DocumentTitle from "../components/common/DocumentTitle";

/* =====================================================
   ANALYTICS
   ===================================================== */

// Create this page if it does not already exist.
import Analytics from "../pages/dashboard/Analytics";

/* =====================================================
   SETTINGS
   ===================================================== */

// Create this page if it does not already exist.
import Settings from "../pages/dashboard/Settings";

/* =====================================================
   ADMIN PANEL
   ===================================================== */

import AdminRoute from "../components/common/AdminRoute";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/Users";
import AdminCrops from "../pages/admin/Crops";
import AdminSensorData from "../pages/admin/SensorData";
import AdminAlerts from "../pages/admin/Alerts";
import AdminMarketplace from "../pages/admin/MarketplaceManagement";

/* =====================================================
   APP ROUTES
   ===================================================== */

function AppRoutes() {
  return (
    <>
      <DocumentTitle />

      <Routes>

      {/* =====================================================
          PUBLIC WEBSITE
          ===================================================== */}

      <Route element={<PublicLayout />}>

        {/* HOME */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* ABOUT */}
        <Route
          path="/about"
          element={<About />}
        />

        {/* FEATURES */}
        <Route
          path="/features"
          element={<Features />}
        />

        {/* HOW IT WORKS */}
        <Route
          path="/how-it-works"
          element={<HowItWorks />}
        />

        {/* =================================================
            PUBLIC CROPS
            24 Crop Knowledge Gallery
            ================================================= */}

        <Route
          path="/crops"
          element={<Crops />}
        />

        {/* CONTACT */}
        <Route
          path="/contact"
          element={<Contact />}
        />

      </Route>

      {/* =====================================================
          AUTHENTICATION
          ===================================================== */}

      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* REGISTER */}
      <Route
        path="/register"
        element={<Register />}
      />

      {/* OTP VERIFICATION */}
      <Route
        path="/verify-otp"
        element={<VerifyOTP />}
      />

      {/* FORGOT PASSWORD */}
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* =====================================================
          PROTECTED APPLICATION
          ===================================================== */}

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >

        {/* =================================================
            1. DASHBOARD
            ================================================= */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* =================================================
            2. MONITORING
            Detailed live crop-specific monitoring
            ================================================= */}

        <Route
          path="/monitoring"
          element={<Monitoring />}
        />

        {/* =================================================
            3. MY FARM
            User's actual farm/crop management
            ================================================= */}

        <Route
          path="/my-farm"
          element={<MyFarm />}
        />

        {/* =================================================
            4. ALERTS
            Crop-specific alerts
            ================================================= */}

        <Route
          path="/alerts"
          element={<Alerts />}
        />

        {/* =================================================
            5. AUTOMATION
            Crop-specific automation
            ================================================= */}

        <Route
          path="/automation"
          element={<Automation />}
        />

        {/* =================================================
            6. CROPS
            Crop Selection entry point
            ================================================= */}

        <Route
          path="/crop-management"
          element={<CropSelection />}
        />

        {/* =================================================
            6A. CROP DETAILS

            Example:
            /crops/HG001
            ================================================= */}

        <Route
          path="/crops/:cropId"
          element={<CropDetails />}
        />

        {/* =================================================
            6B. CROP SCHEDULE

            Example:
            /crops/HG001/schedule
            ================================================= */}

        <Route
          path="/crops/:cropId/schedule"
          element={<CropSchedule />}
        />

        {/* =================================================
            6C. GROWTH TRACKING

            Example:
            /crops/HG001/growth
            ================================================= */}

        <Route
          path="/crops/:cropId/growth"
          element={<GrowthTracking />}
        />

        {/* =================================================
            7. SENSOR HISTORY
            Crop-specific historical sensor readings
            ================================================= */}

        <Route
          path="/sensor-history"
          element={<SensorHistory />}
        />

        {/* =================================================
            8. MARKETPLACE
            ================================================= */}

        <Route
          path="/marketplace"
          element={<Marketplace />}
        />

        <Route
          path="/marketplace/listings"
          element={<MyListings />}
        />

        <Route
          path="/marketplace/orders"
          element={<Orders />}
        />

        {/* =================================================
            9. ANALYTICS
            Crop-specific analytics
            ================================================= */}

        <Route
          path="/analytics"
          element={<Analytics />}
        />

        {/* =================================================
            SETTINGS
            ================================================= */}

        <Route
          path="/settings"
          element={<Settings />}
        />

      </Route>

      {/* =====================================================
          ADMIN PANEL
          ===================================================== */}

      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >

        {/* =================================================
            1. ADMIN OVERVIEW
            ================================================= */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        {/* =================================================
            2. ADMIN USERS
            ================================================= */}

        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />

        {/* =================================================
            3. ADMIN CROPS
            ================================================= */}

        <Route
          path="/admin/crops"
          element={<AdminCrops />}
        />

        {/* =================================================
            4. ADMIN SENSOR DATA
            ================================================= */}

        <Route
          path="/admin/sensor-data"
          element={<AdminSensorData />}
        />

        {/* =================================================
            5. ADMIN SYSTEM ALERTS
            ================================================= */}

        <Route
          path="/admin/alerts"
          element={<AdminAlerts />}
        />

        {/* =================================================
            6. ADMIN MARKETPLACE
            ================================================= */}

        <Route
          path="/admin/marketplace"
          element={<AdminMarketplace />}
        />

      </Route>

      {/* =====================================================
          404 PAGE
          ===================================================== */}

      <Route
        path="*"
        element={
          <div className="not-found-page">
            <div className="hg-empty" style={{ minHeight: "100vh", justifyContent: "center" }}>
              <i className="bi bi-compass" style={{ fontSize: "44px" }}></i>
              <strong style={{ fontSize: "22px" }}>
                404 — Page not found
              </strong>
              <span>
                The page you are looking for does not exist or has moved.
              </span>
              <span style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <Link to="/" className="hg-btn hg-btn--outline">
                  <i className="bi bi-house"></i>
                  Back to Home
                </Link>
                <Link to="/dashboard" className="hg-btn hg-btn--primary">
                  <i className="bi bi-speedometer2"></i>
                  Go to Dashboard
                </Link>
              </span>
            </div>
          </div>
        }
      />

    </Routes>
    </>
  );
}

export default AppRoutes;