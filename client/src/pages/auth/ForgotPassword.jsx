import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import "../../assets/styles/auth.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState("username");

  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState(null);

  const handleUsernameSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Enter your username or email.");
      return;
    }

    setLoading(true);

    const result = await forgotPassword(username.trim());

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (result.devOtp) {
      setDevOtp(result.devOtp);
    }

    setStep("reset");
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Enter the complete 6-digit reset code.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const result = await resetPassword({ otp, password });

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/login", {
      state: { passwordReset: true },
    });
  };

  return (
    <section className="auth-page otp-page">
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
                    PASSWORD RECOVERY
                  </span>

                  <h1>
                    Regain
                    <span>your access.</span>
                  </h1>

                  <p>
                    Verify your identity with a one-time code and
                    set a new password to get back to growing.
                  </p>

                  <div className="auth-panel-features">

                    <div className="auth-panel-feature">
                      <div>
                        <i className="bi bi-shield-lock"></i>
                      </div>
                      <span>Secure reset flow</span>
                    </div>

                    <div className="auth-panel-feature">
                      <div>
                        <i className="bi bi-phone"></i>
                      </div>
                      <span>OTP verification</span>
                    </div>

                    <div className="auth-panel-feature">
                      <div>
                        <i className="bi bi-arrow-right-circle"></i>
                      </div>
                      <span>Back in minutes</span>
                    </div>

                  </div>

                </div>

                <div className="auth-panel-footer">

                  <span>
                    <i className="bi bi-shield-check"></i>
                    Verification required
                  </span>

                  <span>
                    HydroGrow Platform
                  </span>

                </div>

              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
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

                {/* ICON */}
                <div className="auth-page-icon">
                  <i className="bi bi-key"></i>
                </div>

                {/* HEADER */}
                <div className="auth-form-header">
                  <span className="auth-form-label">
                    {step === "username"
                      ? "RESET PASSWORD"
                      : "SET NEW PASSWORD"}
                  </span>

                  <h2>
                    {step === "username"
                      ? "Forgot your password?"
                      : "Create a new password"}
                  </h2>

                  <p>
                    {step === "username"
                      ? "Enter your username or email and we will send a 6-digit reset code."
                      : "Enter the reset code sent to you and choose a new password."}
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

                {/* STEP 1 — USERNAME */}
                {step === "username" && (
                  <form
                    onSubmit={handleUsernameSubmit}
                    className="auth-form"
                  >

                    <div className="auth-field">

                      <label htmlFor="username">
                        Username or Email
                      </label>

                      <div className="auth-input-wrapper">

                        <i className="bi bi-person"></i>

                        <input
                          id="username"
                          type="text"
                          name="username"
                          placeholder="e.g. hydrogrow"
                          value={username}
                          onChange={(event) => {
                            setUsername(event.target.value);

                            if (error) {
                              setError("");
                            }
                          }}
                          autoComplete="username"
                          required
                        />

                      </div>

                    </div>

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
                            Sending code...
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            Send reset code
                          </span>

                          <i className="bi bi-arrow-right"></i>
                        </>
                      )}

                    </button>

                  </form>
                )}

                {/* STEP 2 — OTP + NEW PASSWORD */}
                {step === "reset" && (
                  <form
                    onSubmit={handleResetSubmit}
                    className="auth-form"
                  >

                    <div className="auth-field">

                      <label htmlFor="otp">
                        Reset Code
                      </label>

                      <div className="auth-input-wrapper otp-input-wrapper">

                        <i className="bi bi-shield-lock"></i>

                        <input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength="6"
                          placeholder="Enter 6-digit code"
                          value={otp}
                          onChange={(event) => {
                            const value =
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6);

                            setOtp(value);

                            if (error) {
                              setError("");
                            }
                          }}
                          required
                        />

                      </div>

                    </div>

                    <div className="auth-field">

                      <label htmlFor="password">
                        New Password
                      </label>

                      <div className="auth-input-wrapper">

                        <i className="bi bi-lock"></i>

                        <input
                          id="password"
                          type="password"
                          name="password"
                          placeholder="Minimum 6 characters"
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);

                            if (error) {
                              setError("");
                            }
                          }}
                          autoComplete="new-password"
                          required
                        />

                      </div>

                    </div>

                    <div className="auth-field">

                      <label htmlFor="confirmPassword">
                        Confirm New Password
                      </label>

                      <div className="auth-input-wrapper">

                        <i className="bi bi-shield-lock"></i>

                        <input
                          id="confirmPassword"
                          type="password"
                          name="confirmPassword"
                          placeholder="Repeat new password"
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value);

                            if (error) {
                              setError("");
                            }
                          }}
                          autoComplete="new-password"
                          required
                        />

                      </div>

                    </div>

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
                            Updating password...
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            Reset password
                          </span>

                          <i className="bi bi-check2-circle"></i>
                        </>
                      )}

                    </button>

                  </form>
                )}

                {/* DEVELOPMENT OTP */}
                {devOtp && step === "reset" && (
                  <div className="demo-otp">

                    <div className="demo-login-header">
                      <i className="bi bi-info-circle"></i>
                      <span>Development OTP</span>
                    </div>

                    <div className="demo-otp-code">
                      {devOtp}
                    </div>

                    <small>
                      SMS/email delivery is not configured yet —
                      use this code while the backend runs in
                      development mode.
                    </small>

                  </div>
                )}

                {/* BACK */}
                <div className="auth-back-link">

                  <Link
                    to="/login"
                    className="auth-link"
                  >
                    <i className="bi bi-arrow-left"></i>
                    Back to sign in
                  </Link>

                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
