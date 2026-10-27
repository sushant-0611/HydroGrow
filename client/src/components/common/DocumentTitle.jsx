import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/* =====================================================
   ROUTE TITLES
   ===================================================== */

const TITLES = {
  "/": "HydroGrow — Smart Hydroponic Farming",
  "/about": "About Us | HydroGrow",
  "/features": "Features | HydroGrow",
  "/how-it-works": "How It Works | HydroGrow",
  "/crops": "Crop Library | HydroGrow",
  "/contact": "Contact | HydroGrow",

  "/login": "Login | HydroGrow",
  "/register": "Create Account | HydroGrow",
  "/verify-otp": "Verify OTP | HydroGrow",
  "/forgot-password": "Reset Password | HydroGrow",

  "/dashboard": "Dashboard | HydroGrow",
  "/monitoring": "Live Monitoring | HydroGrow",
  "/my-farm": "My Farm | HydroGrow",
  "/alerts": "Alerts | HydroGrow",
  "/automation": "Automation | HydroGrow",
  "/crop-management": "Crop Management | HydroGrow",
  "/sensor-history": "Sensor History | HydroGrow",
  "/marketplace": "Marketplace | HydroGrow",
  "/marketplace/listings": "My Listings | HydroGrow",
  "/marketplace/orders": "My Orders | HydroGrow",
  "/analytics": "Analytics | HydroGrow",
  "/settings": "Settings | HydroGrow",

  "/admin": "Admin Overview | HydroGrow",
  "/admin/users": "Users | HydroGrow Admin",
  "/admin/crops": "Crops | HydroGrow Admin",
  "/admin/sensor-data": "Sensor Data | HydroGrow Admin",
  "/admin/alerts": "System Alerts | HydroGrow Admin",
  "/admin/marketplace": "Marketplace | HydroGrow Admin",
};

const CROP_ROUTE =
  /^\/crops\/[^/]+(\/schedule|\/growth)?$/;

function resolveTitle(pathname) {
  if (TITLES[pathname]) {
    return TITLES[pathname];
  }

  const cropMatch = pathname.match(CROP_ROUTE);

  if (cropMatch) {
    if (cropMatch[1] === "/schedule") {
      return "Crop Schedule | HydroGrow";
    }

    if (cropMatch[1] === "/growth") {
      return "Growth Tracking | HydroGrow";
    }

    return "Crop Details | HydroGrow";
  }

  return "Page Not Found | HydroGrow";
}

/* =====================================================
   COMPONENT
   ===================================================== */

export default function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = resolveTitle(pathname);
  }, [pathname]);

  return null;
}
