/* =========================================================
   ADMIN ONLY
   Must run after protect — checks the account role.
   ========================================================= */

const adminOnly = (req, res, next) => {
  if (req.user && ["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    return next();
  }

  res.status(403);

  next(new Error("Access denied — administrator privileges required."));
};

module.exports = { adminOnly };
