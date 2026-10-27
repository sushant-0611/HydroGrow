const express = require("express");

const router = express.Router();

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  me,
  updateProfile,
  updateSettings,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", protect, me);
router.put("/profile", protect, updateProfile);
router.put("/settings", protect, updateSettings);
router.put("/password", protect, changePassword);

module.exports = router;
