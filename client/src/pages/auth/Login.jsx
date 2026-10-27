import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import "../../assets/styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [role, setRole] = useState("USER");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(
      form.username.trim(),
      form.password,
      role
    );

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate(
      result.user.role === "ADMIN" ? "/admin" : "/dashboard"
    );
  };

  return (
    <section className="auth-page login-page">
      <div className="container-fluid">
        <div className="row min-vh-100 g-0">

          {/* LEFT BRAND PANEL */}
          <div className="col-lg-5 d-none d-lg-flex">
            <div className="auth-brand-panel">
              <div className="auth-brand-panel-content">

                <Link to="/" className="auth-panel-brand">
                  <span className="auth-panel-brand-icon">
                    <i className="bi bi-leaf-fill"></i>
                  </span>

                  <span>HydroGrow</span>
                </Link>

                <div className="auth-panel-main">
                  <span className="auth-panel-label">
                    INTELLIGENT HYDROPONICS
                  </span>

                  <h1>
                    Grow smarter.
                    <span>Grow better.</span>
                  </h1>

                  <p>
                    Monitor your growing environment, manage crops,
                    understand sensor data and make better cultivation
                    decisions with HydroGrow.
                  </p>

                  <div className="auth-panel-features">

                    <div className="auth-panel-feature">
                      <div>
                        <i className="bi bi-activity"></i>
                      </div>
                      <span>Live monitoring</span>
                    </div>

                    <div className="auth-panel-feature">
                      <div>
                        <i className="bi bi-flower1"></i>
                      </div>
                      <span>Crop management</span>
                    </div>

                    <div className="auth-panel-feature">
                      <div>
                        <i className="bi bi-bell"></i>
                      </div>
                      <span>Smart alerts</span>
                    </div>

                  </div>
                </div>

                <div className="auth-panel-footer">
                  <span>
                    <i className="bi bi-shield-check"></i>
                    Secure platform access
                  </span>

                  <span>
                    HydroGrow Platform
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT FORM PANEL */}
          <div className="col-lg-7">
            <div className="auth-form-panel">

              <div className="auth-form-container">

                {/* MOBILE BRAND */}
                <div className="auth-mobile-brand d-lg-none">
                  <Link to="/" className="auth-brand">
                    <span className="brand-icon">
                      <i className="bi bi-leaf-fill"></i>
                    </span>

                    <span className="brand-name">
                      HydroGrow
                    </span>
                  </Link>
                </div>

                {/* HEADER */}
                <div className="auth-form-header">
                  <span className="auth-form-label">
                    WELCOME BACK
                  </span>

                  <h2>
                    Sign in to HydroGrow
                  </h2>

                  <p>
                    Access your dashboard, crop information,
                    monitoring data and growing insights.
                  </p>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="auth-error" role="alert">

                    <div className="auth-error-icon">
                      <i className="bi bi-exclamation-circle"></i>
                    </div>

                    <span>{error}</span>

                    <button
                      type="button"
                      onClick={() => setError("")}
                      aria-label="Close error"
                    >
                      <i className="bi bi-x"></i>
                    </button>

                  </div>
                )}

                {/* FORM */}
                <form
                  onSubmit={handleSubmit}
                  className="auth-form"
                >

                  {/* ROLE SELECTOR */}
                  <div className="auth-field">

                    <label>
                      Sign in as
                    </label>

                    <div
                      className="auth-role-selector"
                      role="radiogroup"
                      aria-label="Select account type"
                    >

                      <button
                        type="button"
                        role="radio"
                        aria-checked={role === "USER"}
                        className={`auth-role-option ${
                          role === "USER" ? "active" : ""
                        }`}
                        onClick={() => handleRoleChange("USER")}
                      >
                        <i className="bi bi-person-badge"></i>
                        <span>
                          <strong>Client</strong>
                          <small>Farm dashboard</small>
                        </span>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={role === "ADMIN"}
                        className={`auth-role-option ${
                          role === "ADMIN" ? "active" : ""
                        }`}
                        onClick={() => handleRoleChange("ADMIN")}
                      >
                        <i className="bi bi-shield-lock"></i>
                        <span>
                          <strong>Administrator</strong>
                          <small>Admin console</small>
                        </span>
                      </button>

                    </div>

                  </div>

                  {/* USERNAME */}
                  <div className="auth-field">

                    <label htmlFor="username">
                      Username
                    </label>

                    <div className="auth-input-wrapper">

                      <i className="bi bi-person"></i>

                      <input
                        id="username"
                        type="text"
                        name="username"
                        placeholder="Enter your username"
                        value={form.username}
                        onChange={handleChange}
                        autoComplete="username"
                        required
                      />

                    </div>

                  </div>

                  {/* PASSWORD */}
                  <div className="auth-field">

                    <label htmlFor="password">
                      Password
                    </label>

                    <div className="auth-input-wrapper">

                      <i className="bi bi-lock"></i>

                      <input
                        id="password"
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        required
                      />

                    </div>

                  </div>

                  {/* FORGOT PASSWORD */}
                  <div className="auth-forgot-row">

                    <Link
                      to="/forgot-password"
                      className="auth-link"
                    >
                      Forgot password?
                    </Link>

                  </div>

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading}
                  >

                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          aria-hidden="true"
                        ></span>

                        <span>
                          Signing in...
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          Sign In
                        </span>

                        <i className="bi bi-arrow-right"></i>
                      </>
                    )}

                  </button>

                </form>

                {/* DIVIDER */}
                <div className="auth-divider">
                  <span>OR</span>
                </div>

                {/* REGISTER */}
                <div className="auth-switch">

                  <span>
                    Don't have an account?
                  </span>

                  <Link to="/register">
                    Create one
                    <i className="bi bi-arrow-right"></i>
                  </Link>

                </div>

                {/* DEMO LOGIN */}
                <div className="demo-login">

                  <div className="demo-login-header">
                    <i className="bi bi-info-circle"></i>
                    <span>
                      Demo Account · {
                        role === "ADMIN" ? "Administrator" : "Client"
                      }
                    </span>
                  </div>

                  <div className="demo-login-row">
                    <span>Username</span>
                    <strong>
                      {role === "ADMIN" ? "admin" : "hydrogrow"}
                    </strong>
                  </div>

                  <div className="demo-login-row">
                    <span>Password</span>
                    <strong>
                      {role === "ADMIN" ? "admin123" : "hydrogrow123"}
                    </strong>
                  </div>

                </div>

                <p className="auth-terms">
                  Accounts are verified against the HydroGrow backend
                  with secure JWT sessions.
                </p>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Login;