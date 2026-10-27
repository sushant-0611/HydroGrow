import {
  Outlet,
  Link,
  useNavigate,
  NavLink,
} from "react-router-dom";

import { useState } from "react";
import useAuth from "../hooks/useAuth";
import AssistantBot from "../components/AssistantBot";
import "../assets/styles/dashboard-layout.css";

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* =========================================================
     LOGOUT
     ========================================================= */

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* =========================================================
     USER INFORMATION
     ========================================================= */

  const userName = user?.name || "HydroGrow User";
  const userRole = user?.role || "USER";

  const userInitial = userName
    .trim()
    .charAt(0)
    .toUpperCase();

  /* =========================================================
     SIDEBAR TOGGLE
     ========================================================= */

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => !current);
  };

  return (
    <div
      className={`dashboard-layout ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {/* =====================================================
          TOP NAVBAR
          ===================================================== */}

      <header className="dashboard-topbar">

        {/* ===================================================
            BRAND
            =================================================== */}

        <div className="dashboard-topbar-left">
          <Link
            to="/dashboard"
            className="dashboard-brand"
            aria-label="HydroGrow Dashboard"
          >
            <span className="dashboard-brand-icon">
              <i className="bi bi-leaf-fill"></i>
            </span>

            <span className="dashboard-brand-text">
              <strong>HydroGrow</strong>

              <small>
                Intelligent Hydroponics
              </small>
            </span>
          </Link>
        </div>

        {/* ===================================================
            RIGHT SIDE
            =================================================== */}

        <div className="dashboard-topbar-right">

          {/* =================================================
              SYSTEM STATUS
              ================================================= */}

          <div className="dashboard-system-status">
            <span className="dashboard-status-dot"></span>

            <span>
              System Online
            </span>
          </div>

          <div className="dashboard-divider"></div>

          {/* =================================================
              USER
              ================================================= */}

          <div className="dashboard-user">

            <div className="dashboard-user-avatar">
              {userInitial || "U"}
            </div>

            <div className="dashboard-user-info">
              <strong>
                {userName}
              </strong>

              <span>
                {userRole}
              </span>
            </div>

          </div>

          <div className="dashboard-divider"></div>

          {/* =================================================
              LOGOUT
              ================================================= */}

          <button
            type="button"
            className="dashboard-logout"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i>

            <span>
              Logout
            </span>
          </button>

        </div>
      </header>

      {/* =====================================================
          DASHBOARD BODY
          ===================================================== */}

      <div className="dashboard-body">

        {/* ===================================================
            SIDEBAR
            =================================================== */}

        <aside className="dashboard-sidebar">

          {/* =================================================
              SIDEBAR TOGGLE
              ================================================= */}

          <button
            type="button"
            className="dashboard-sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed
                ? "Open sidebar"
                : "Close sidebar"
            }
            title={
              sidebarCollapsed
                ? "Open sidebar"
                : "Close sidebar"
            }
          >
            <i
              className={
                sidebarCollapsed
                  ? "bi bi-chevron-right"
                  : "bi bi-chevron-left"
              }
            ></i>
          </button>

          {/* =================================================
              SIDEBAR CONTENT
              ================================================= */}

          <div className="dashboard-sidebar-inner">

            {/* =================================================
                MAIN MENU
                ================================================= */}

            <div className="dashboard-menu-section">

              <div className="dashboard-menu-label">
                MAIN
              </div>

              <nav
                className="dashboard-nav"
                aria-label="Dashboard navigation"
              >

                {/* =============================================
                    1. DASHBOARD
                    ============================================= */}

                <NavItem
                  to="/dashboard"
                  icon="bi-speedometer2"
                  label="Dashboard"
                  end
                />

                {/* =============================================
                    2. MONITORING
                    ============================================= */}

                <NavItem
                  to="/monitoring"
                  icon="bi-activity"
                  label="Monitoring"
                />

                {/* =============================================
                    3. MY FARM
                    ============================================= */}

                <NavItem
                  to="/my-farm"
                  icon="bi-house-heart"
                  label="My Farm"
                />

                {/* =============================================
                    4. ALERTS
                    ============================================= */}

                <NavItem
                  to="/alerts"
                  icon="bi-bell"
                  label="Alerts"
                />

                {/* =============================================
                    5. AUTOMATION
                    ============================================= */}

                <NavItem
                  to="/automation"
                  icon="bi-cpu"
                  label="Automation"
                />

                {/* =============================================
                    6. CROPS
                    Entry point:
                    Crop Selection
                    ============================================= */}

                <NavItem
                  to="/crop-management"
                  icon="bi-flower1"
                  label="Crops"
                />

                {/* =============================================
                    7. SENSOR HISTORY
                    ============================================= */}

                <NavItem
                  to="/sensor-history"
                  icon="bi-clock-history"
                  label="Sensor History"
                />

                  {/* =============================================
                    8. ANALYTICS
                    ============================================= */}

                <NavItem
                  to="/analytics"
                  icon="bi-bar-chart-line"
                  label="Analytics"
                />

                {/* =============================================
                    9. MARKETPLACE
                    ============================================= */}

                <NavItem
                  to="/marketplace"
                  icon="bi-shop"
                  label="Marketplace"
                />

                

              </nav>
            </div>

            {/* =================================================
                ADDITIONAL
                ================================================= */}

            <div className="dashboard-quick-section">

              <div className="dashboard-menu-label">
                ADDITIONAL
              </div>

              {/* =============================================
                  SETTINGS
                  ============================================= */}

              <NavItem
                to="/settings"
                icon="bi-gear"
                label="Settings"
              />

            </div>

          </div>
        </aside>

        {/* ===================================================
            MAIN CONTENT
            =================================================== */}

        <main className="dashboard-main">

          <div className="dashboard-main-inner">
            <Outlet />
          </div>

        </main>

      </div>

      <AssistantBot />
    </div>
  );
}

/* =========================================================
   NAV ITEM COMPONENT
   ========================================================= */

function NavItem({
  to,
  icon,
  label,
  end = false,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `dashboard-nav-item ${
          isActive ? "active" : ""
        }`
      }
      title={label}
    >

      {/* ===================================================
          ICON
          =================================================== */}

      <span className="dashboard-nav-icon">
        <i className={`bi ${icon}`}></i>
      </span>

      {/* ===================================================
          LABEL
          =================================================== */}

      <span className="dashboard-nav-label">
        {label}
      </span>

      {/* ===================================================
          ARROW
          =================================================== */}

      <i className="bi bi-chevron-right dashboard-nav-arrow"></i>

    </NavLink>
  );
}

export default DashboardLayout;