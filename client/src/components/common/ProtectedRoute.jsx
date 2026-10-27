import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  /* =====================================================
     AUTHENTICATION CHECK LOADING
     ===================================================== */

  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="protected-loading-card">

          <div className="protected-loading-icon">
            <i className="bi bi-leaf-fill"></i>
          </div>

          <div className="protected-loading-spinner">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <h2>HydroGrow</h2>

          <p>
            Checking your account...
          </p>

        </div>
      </div>
    );
  }

  /* =====================================================
     NOT AUTHENTICATED
     ===================================================== */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  /* =====================================================
     AUTHENTICATED
     ===================================================== */

  return children;
}

export default ProtectedRoute;