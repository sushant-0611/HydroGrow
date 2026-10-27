import { Link } from "react-router-dom";
import "../../assets/styles/footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hydrogrow-footer">

      {/* =====================================================
          MAIN FOOTER
          ===================================================== */}

      <div className="container">

        <div className="hydrogrow-footer-main">

          {/* =================================================
              BRAND
              ================================================= */}

          <div className="hydrogrow-footer-brand">

            <Link
              to="/"
              className="hydrogrow-footer-logo"
            >
              <span className="hydrogrow-footer-logo-icon">
                <i className="bi bi-leaf-fill"></i>
              </span>

              <span className="hydrogrow-footer-logo-text">
                <strong>HydroGrow</strong>
                <small>
                  Intelligent Hydroponics
                </small>
              </span>
            </Link>


            <p className="hydrogrow-footer-description">
              A digital hydroponics platform designed to monitor
              growing conditions, manage crops, generate alerts
              and support intelligent cultivation decisions.
            </p>


            <div className="hydrogrow-footer-status">

              <span className="footer-status-dot"></span>

              <span>
                Smart Hydroponics Platform
              </span>

            </div>

          </div>


          {/* =================================================
              PLATFORM
              ================================================= */}

          <div className="hydrogrow-footer-column">

            <h3>Platform</h3>

            <ul>

              <li>
                <Link to="/about">
                  <i className="bi bi-chevron-right"></i>
                  About
                </Link>
              </li>

              <li>
                <Link to="/features">
                  <i className="bi bi-chevron-right"></i>
                  Features
                </Link>
              </li>

              <li>
                <Link to="/how-it-works">
                  <i className="bi bi-chevron-right"></i>
                  How It Works
                </Link>
              </li>

              <li>
                <Link to="/crops">
                  <i className="bi bi-chevron-right"></i>
                  Crop Library
                </Link>
              </li>

            </ul>

          </div>


          {/* =================================================
              ACCOUNT
              ================================================= */}

          <div className="hydrogrow-footer-column">

            <h3>Account</h3>

            <ul>

              <li>
                <Link to="/login">
                  <i className="bi bi-chevron-right"></i>
                  Login
                </Link>
              </li>

              <li>
                <Link to="/register">
                  <i className="bi bi-chevron-right"></i>
                  Create Account
                </Link>
              </li>

              <li>
                <Link to="/contact">
                  <i className="bi bi-chevron-right"></i>
                  Support
                </Link>
              </li>

            </ul>

          </div>


          {/* =================================================
              CONTACT
              ================================================= */}

          <div className="hydrogrow-footer-column hydrogrow-footer-contact">

            <h3>Get in Touch</h3>

            <div className="footer-contact-item">

              <span className="footer-contact-icon">
                <i className="bi bi-envelope"></i>
              </span>

              <div>
                <small>Email</small>
                <span>HydroGrow Support</span>
              </div>

            </div>


            <div className="footer-contact-item">

              <span className="footer-contact-icon">
                <i className="bi bi-globe2"></i>
              </span>

              <div>
                <small>Platform</small>
                <span>Smart Hydroponics</span>
              </div>

            </div>


            <Link
              to="/contact"
              className="footer-contact-button"
            >
              Contact Us
              <i className="bi bi-arrow-right"></i>
            </Link>

          </div>

        </div>


        {/* =====================================================
            FOOTER DIVIDER
            ===================================================== */}

        <div className="hydrogrow-footer-divider"></div>


        {/* =====================================================
            FOOTER BOTTOM
            ===================================================== */}

        <div className="hydrogrow-footer-bottom">

          <p>
            © {currentYear} HydroGrow. All rights reserved.
          </p>


          <div className="hydrogrow-footer-bottom-links">

            <span>
              Intelligent Hydroponics Monitoring &amp; Automation
            </span>

          </div>

        </div>

      </div>

    </footer>
  );
}

export default Footer;