import { Outlet } from "react-router-dom";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

import "../assets/styles/public-layout.css";
function PublicLayout() {
  return (
    <div className="hydrogrow-app">

      {/* =====================================================
          GLOBAL NAVBAR
          ===================================================== */}

      <Navbar />

      {/* =====================================================
          MAIN WEBSITE CONTENT
          ===================================================== */}

      <main className="hydrogrow-main">
        <Outlet />
      </main>

      {/* =====================================================
          GLOBAL FOOTER
          ===================================================== */}

      <Footer />

    </div>
  );
}

export default PublicLayout;