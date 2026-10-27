const jwt = require("jsonwebtoken");

const env = require("../config/env");

const User = require("../models/User");

/* =========================================================
   PROTECT
   Validates the Bearer token and attaches req.user.
   ========================================================= */

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      res.status(401);

      throw new Error("Not authorized — token missing.");
    }

    const token = header.split(" ")[1];

    let decoded;

    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch {
      res.status(401);

      throw new Error("Not authorized — token invalid or expired.");
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);

      throw new Error("Account no longer exists.");
    }

    if (!user.isActive) {
      res.status(403);

      throw new Error("Account is deactivated. Contact the administrator.");
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   OPTIONAL PROTECT
   Attaches req.user when a valid token is present,
   but never rejects anonymous requests.
   ========================================================= */

const optionalProtect = async (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return next();
  }

  try {
    const decoded = jwt.verify(header.split(" ")[1], env.jwtSecret);

    const user = await User.findById(decoded.id);

    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // anonymous
  }

  next();
};

module.exports = { protect, optionalProtect };
