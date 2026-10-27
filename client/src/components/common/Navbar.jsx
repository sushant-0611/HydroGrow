import { Link, NavLink } from "react-router-dom";
import "../../assets/styles/navbar.css";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg hydrogrow-main-navbar">
      <div className="container">

        {/* =====================================================
            BRAND
            ===================================================== */}

        <Link
          to="/"
          className="navbar-brand hydrogrow-brand"
        >
          <span className="hydrogrow-brand-icon">
            <i className="bi bi-leaf-fill"></i>
          </span>

          <span className="hydrogrow-brand-text">
            <strong>HydroGrow</strong>

            <small>
              Intelligent Hydroponics
            </small>
          </span>
        </Link>


        {/* =====================================================
            MOBILE TOGGLE
            ===================================================== */}

        <button
          className="navbar-toggler hydrogrow-navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#hydrogrowNavbar"
          aria-controls="hydrogrowNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>


        {/* =====================================================
            NAVIGATION
            ===================================================== */}

        <div
          className="collapse navbar-collapse"
          id="hydrogrowNavbar"
        >

          <ul className="navbar-nav ms-auto align-items-lg-center">

            {/* HOME */}

            <li className="nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link hydrogrow-nav-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span>Home</span>
              </NavLink>
            </li>


            {/* ABOUT */}

            <li className="nav-item">
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `nav-link hydrogrow-nav-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span>About</span>
              </NavLink>
            </li>


            {/* FEATURES */}

            <li className="nav-item">
              <NavLink
                to="/features"
                className={({ isActive }) =>
                  `nav-link hydrogrow-nav-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span>Features</span>
              </NavLink>
            </li>


            {/* HOW IT WORKS */}

            <li className="nav-item">
              <NavLink
                to="/how-it-works"
                className={({ isActive }) =>
                  `nav-link hydrogrow-nav-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span>How It Works</span>
              </NavLink>
            </li>


            {/* CROPS */}

            <li className="nav-item">
              <NavLink
                to="/crops"
                className={({ isActive }) =>
                  `nav-link hydrogrow-nav-link hydrogrow-crops-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <i className="bi bi-grid-3x3-gap-fill"></i>
                <span>Crops</span>
              </NavLink>
            </li>


            {/* CONTACT */}

            <li className="nav-item">
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `nav-link hydrogrow-nav-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span>Contact</span>
              </NavLink>
            </li>


            {/* LOGIN */}

            <li className="nav-item hydrogrow-login-item">

              <Link
                to="/login"
                className="hydrogrow-login-btn"
              >
                <span className="hydrogrow-login-icon">
                  <i className="bi bi-box-arrow-in-right"></i>
                </span>

                <span>
                  Login
                </span>
              </Link>

            </li>

          </ul>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;