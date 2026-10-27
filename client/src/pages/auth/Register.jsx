import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import "../../assets/styles/auth.css";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    username: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (form.username.trim().length < 3) {
      setError("Username must contain at least 3 characters.");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const result = await register({
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      mobile: form.mobile,
      password: form.password,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/verify-otp");
  };

  return (
    <section className="auth-page register-page">

      <div className="container-fluid">

        <div className="row min-vh-100 g-0">

          {/* =================================================
              LEFT BRAND PANEL
              ================================================= */}

          <div className="col-lg-5 d-none d-lg-flex">

            <div className="auth-brand-panel">

              <div className="auth-brand-panel-content">

                <Link
                  to="/"
                  className="auth-panel-brand"
                >
                  <span className="auth-panel-brand-icon">
                    <i className="bi bi-leaf-fill"></i>
                  </span>

                  <span>
                    HydroGrow
                  </span>
                </Link>


                <div className="auth-panel-main">

                  <span className="auth-panel-label">
                    SMART HYDROPONICS
                  </span>

                  <h1>
                    Grow smarter.
                    <span>Grow better.</span>
                  </h1>

                  <p>
                    Create your HydroGrow account and bring your
                    hydroponic monitoring, crop management and
                    growing insights together in one platform.
                  </p>


                  <div className="auth-panel-features">

                    <div className="auth-panel-feature">

                      <div>
                        <i className="bi bi-activity"></i>
                      </div>

                      <span>
                        Smart monitoring
                      </span>

                    </div>


                    <div className="auth-panel-feature">

                      <div>
                        <i className="bi bi-flower1"></i>
                      </div>

                      <span>
                        Crop management
                      </span>

                    </div>


                    <div className="auth-panel-feature">

                      <div>
                        <i className="bi bi-bell"></i>
                      </div>

                      <span>
                        Intelligent alerts
                      </span>

                    </div>

                  </div>

                </div>


                <div className="auth-panel-footer">

                  <span>
                    <i className="bi bi-shield-check"></i>
                    Secure account access
                  </span>

                  <span>
                    HydroGrow Platform
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              RIGHT REGISTER PANEL
              ================================================= */}

          <div className="col-lg-7">

            <div className="auth-form-panel">

              <div className="auth-form-container">

                {/* MOBILE BRAND */}

                <div className="auth-mobile-brand d-lg-none">

                  <Link
                    to="/"
                    className="auth-brand"
                  >
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
                    CREATE ACCOUNT
                  </span>

                  <h2>
                    Start your HydroGrow journey
                  </h2>

                  <p>
                    Create your account to access the HydroGrow
                    platform and continue with mobile verification.
                  </p>

                </div>


                {/* ERROR */}

                {error && (
                  <div
                    className="auth-error"
                    role="alert"
                  >
                    <div className="auth-error-icon">
                      <i className="bi bi-exclamation-circle"></i>
                    </div>

                    <span>
                      {error}
                    </span>

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

                  {/* FULL NAME */}

                  <div className="auth-field">

                    <label htmlFor="name">
                      Full Name
                    </label>

                    <div className="auth-input-wrapper">

                      <i className="bi bi-person"></i>

                      <input
                        id="name"
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={handleChange}
                        autoComplete="name"
                        required
                      />

                    </div>

                  </div>


                  {/* USERNAME + MOBILE */}

                  <div className="row g-3">

                    <div className="col-md-6">

                      <div className="auth-field">

                        <label htmlFor="username">
                          Username
                        </label>

                        <div className="auth-input-wrapper">

                          <i className="bi bi-at"></i>

                          <input
                            id="username"
                            type="text"
                            name="username"
                            placeholder="Choose username"
                            value={form.username}
                            onChange={handleChange}
                            autoComplete="username"
                            required
                          />

                        </div>

                      </div>

                    </div>


                    <div className="col-md-6">

                      <div className="auth-field">

                        <label htmlFor="mobile">
                          Mobile Number
                        </label>

                        <div className="auth-input-wrapper">

                          <span className="auth-country-code">
                            +91
                          </span>

                          <input
                            id="mobile"
                            type="tel"
                            name="mobile"
                            placeholder="10-digit mobile"
                            value={form.mobile}
                            onChange={(event) => {
                              const value =
                                event.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 10);

                              setForm((current) => ({
                                ...current,
                                mobile: value,
                              }));

                              if (error) {
                                setError("");
                              }
                            }}
                            inputMode="numeric"
                            autoComplete="tel"
                            maxLength="10"
                            required
                          />

                        </div>

                      </div>

                    </div>

                  </div>


                  {/* PASSWORD + CONFIRM */}

                  <div className="row g-3">

                    <div className="col-md-6">

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
                            placeholder="Minimum 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                          />

                        </div>

                      </div>

                    </div>


                    <div className="col-md-6">

                      <div className="auth-field">

                        <label htmlFor="confirmPassword">
                          Confirm Password
                        </label>

                        <div className="auth-input-wrapper">

                          <i className="bi bi-shield-lock"></i>

                          <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            placeholder="Repeat password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                          />

                        </div>

                      </div>

                    </div>

                  </div>


                  {/* PASSWORD INFO */}

                  <div className="auth-password-info">

                    <i className="bi bi-info-circle"></i>

                    <span>
                      Use at least 6 characters for your password.
                    </span>

                  </div>


                  {/* SUBMIT */}

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          aria-hidden="true"
                        ></span>
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          Continue to OTP
                        </span>

                        <i className="bi bi-arrow-right"></i>
                      </>
                    )}
                  </button>

                </form>


                {/* LOGIN */}

                <div className="auth-switch">

                  <span>
                    Already have an account?
                  </span>

                  <Link to="/login">
                    Sign in
                    <i className="bi bi-arrow-right"></i>
                  </Link>

                </div>


                {/* TERMS */}

                <p className="auth-terms">
                  By creating an account, you agree to continue
                  with HydroGrow's account verification process.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Register;