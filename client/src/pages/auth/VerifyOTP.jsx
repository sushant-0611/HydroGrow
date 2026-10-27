import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import "../../assets/styles/auth.css";

function VerifyOTP() {
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devOtp, setDevOtp] = useState(() => {
    try {
      const pending = JSON.parse(
        localStorage.getItem("hydrogrow_pending_user") || "null"
      );

      return pending ? pending.devOtp : null;
    } catch {
      return null;
    }
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);

    const result = await verifyOtp(otp);

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate(result.user.role === "ADMIN" ? "/admin" : "/dashboard");
  };

  const handleResend = async () => {
    setResending(true);

    const result = await resendOtp();

    setResending(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (result.devOtp) {
      setDevOtp(result.devOtp);
    }
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
                    ACCOUNT VERIFICATION
                  </span>

                  <h1>
                    One step
                    <span>to get started.</span>
                  </h1>

                  <p>
                    Verify your mobile number to complete your
                    HydroGrow account registration and continue
                    to the platform.
                  </p>

                  <div className="auth-panel-features">

                    <div className="auth-panel-feature">
                      <div>
                        <i className="bi bi-phone"></i>
                      </div>
                      <span>Mobile verification</span>
                    </div>

                    <div className="auth-panel-feature">
                      <div>
                        <i className="bi bi-shield-check"></i>
                      </div>
                      <span>Secure access</span>
                    </div>

                    <div className="auth-panel-feature">
                      <div>
                        <i className="bi bi-arrow-right-circle"></i>
                      </div>
                      <span>Quick account setup</span>
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

                {/* OTP ICON */}
                <div className="auth-page-icon">
                  <i className="bi bi-phone"></i>
                </div>

                {/* HEADER */}
                <div className="auth-form-header">
                  <span className="auth-form-label">
                    VERIFY MOBILE
                  </span>

                  <h2>
                    Verify your mobile number
                  </h2>

                  <p>
                    Enter the 6-digit verification code sent
                    to your registered mobile number.
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

                {/* OTP FORM */}
                <form
                  onSubmit={handleSubmit}
                  className="auth-form"
                >

                  <div className="auth-field">

                    <label htmlFor="otp">
                      Verification Code
                    </label>

                    <div className="auth-input-wrapper otp-input-wrapper">

                      <i className="bi bi-shield-lock"></i>

                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength="6"
                        placeholder="Enter 6-digit OTP"
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
                          Verifying...
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          Verify OTP
                        </span>

                        <i className="bi bi-check2-circle"></i>
                      </>
                    )}

                  </button>

                </form>

                {/* DEVELOPMENT OTP */}
                {devOtp && (
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

                {/* RESEND */}
                <div className="auth-back-link">

                  <button
                    type="button"
                    className="auth-link"
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                    {resending ? "Sending a new code..." : "Resend verification code"}
                  </button>

                </div>

                {/* BACK */}
                <div className="auth-back-link">

                  <Link
                    to="/register"
                    className="auth-link"
                  >
                    <i className="bi bi-arrow-left"></i>
                    Back to registration
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

export default VerifyOTP;