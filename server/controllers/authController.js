const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

// ---------------------------------------------------
// PUBLIC
// ---------------------------------------------------

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body || {});

  res.status(201).json({ success: true, ...result });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { username, otp } = req.body || {};

  const result = await authService.verifyRegistrationOtp(username, otp);

  res.status(200).json({ success: true, message: "Account verified.", ...result });
});

const resendOtp = asyncHandler(async (req, res) => {
  const { username } = req.body || {};

  const result = await authService.resendOtp(username);

  res.status(200).json({ success: true, ...result });
});

const login = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body || {};

  const identifier = username || email;

  const result = await authService.loginUser(identifier, password, role);

  res.status(200).json({
    success: true,
    message: "Signed in successfully.",
    ...result,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { username } = req.body || {};

  const result = await authService.requestPasswordReset(username);

  res.status(200).json({ success: true, ...result });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { username, otp, password } = req.body || {};

  const result = await authService.resetPassword(username, otp, password);

  res.status(200).json({ success: true, ...result });
});

// ---------------------------------------------------
// PROTECTED
// ---------------------------------------------------

const me = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user._id);

  res.status(200).json({ success: true, user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body || {});

  res.status(200).json({ success: true, message: "Profile updated.", user });
});

const updateSettings = asyncHandler(async (req, res) => {
  const user = await authService.updateSettings(req.user._id, req.body || {});

  res.status(200).json({ success: true, message: "Settings updated.", user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  const result = await authService.changePassword(
    req.user._id,
    currentPassword,
    newPassword
  );

  res.status(200).json({ success: true, ...result });
});

module.exports = {
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
};
