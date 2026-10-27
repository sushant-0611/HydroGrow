const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const OTP_EXPIRY_MINUTES = 10;

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const generateToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const generateOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

const otpExpiry = () =>
  new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

const findUserByIdentifier = async (identifier) => {
  if (!identifier) return null;

  const value = String(identifier).trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ username: value }, { email: value }],
  }).select("+password");

  return user;
};

const issueAuthResult = (user) => ({
  token: generateToken(user._id),
  user: user.toSafeJSON(),
});

// ---------------------------------------------------
// REGISTRATION
// ---------------------------------------------------

async function registerUser(payload) {
  const name = String(payload.name || "").trim();
  const username = String(payload.username || "").trim().toLowerCase();
  const email = String(payload.email || "").trim().toLowerCase();
  const mobile = String(payload.mobile || "").trim();
  const password = String(payload.password || "");

  if (name.length < 2) {
    throw new ApiError(400, "Please enter your full name.");
  }

  if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
    throw new ApiError(
      400,
      "Username must be 3-30 characters (letters, numbers, dot or underscore)."
    );
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }

  const existingUsername = await User.findOne({ username });

  if (existingUsername) {
    throw new ApiError(409, "This username is already taken.");
  }

  if (email) {
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      throw new ApiError(409, "This email is already registered.");
    }
  }

  const otp = generateOtp();

  const user = await User.create({
    name,
    username,
    email,
    mobile,
    password,
    role: "USER",
    isVerified: false,
    otp: {
      code: otp,
      purpose: "REGISTER",
      expiresAt: otpExpiry(),
    },
  });

  const otpSent = true;

  return {
    message:
      "Account created. Enter the verification code sent to your mobile/email.",
    otpSent,
    ...(env.isDevelopment ? { devOtp: otp } : {}),
  };
}

// ---------------------------------------------------
// OTP VERIFY / RESEND
// ---------------------------------------------------

async function verifyRegistrationOtp(username, otp) {
  const user = await User.findOne({
    username: String(username || "").trim().toLowerCase(),
  });

  if (!user) {
    throw new ApiError(404, "Account not found. Please register again.");
  }

  if (user.isVerified) {
    return issueAuthResult(user);
  }

  if (
    !user.otp ||
    user.otp.purpose !== "REGISTER" ||
    user.otp.code !== String(otp).trim()
  ) {
    throw new ApiError(400, "Invalid verification code.");
  }

  if (user.otp.expiresAt < new Date()) {
    throw new ApiError(400, "Verification code expired. Request a new one.");
  }

  user.isVerified = true;
  user.otp = undefined;
  await user.save();

  return issueAuthResult(user);
}

async function resendOtp(username) {
  const user = await User.findOne({
    username: String(username || "").trim().toLowerCase(),
  });

  if (!user) {
    throw new ApiError(404, "Account not found. Please register again.");
  }

  if (user.isVerified) {
    throw new ApiError(400, "This account is already verified. Please sign in.");
  }

  const otp = generateOtp();

  user.otp = {
    code: otp,
    purpose: "REGISTER",
    expiresAt: otpExpiry(),
  };

  await user.save();

  return {
    message: "A new verification code has been sent.",
    ...(env.isDevelopment ? { devOtp: otp } : {}),
  };
}

// ---------------------------------------------------
// LOGIN
// ---------------------------------------------------

async function loginUser(identifier, password, role = "USER") {
  const user = await findUserByIdentifier(identifier);

  if (!user) {
    throw new ApiError(401, "Invalid credentials. Please try again.");
  }

  const passwordMatches = await user.comparePassword(String(password || ""));

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid credentials. Please try again.");
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "Your account has been deactivated. Contact support for help."
    );
  }

  if (!user.isVerified) {
    throw new ApiError(
      403,
      "Please verify your account with the code sent to you, then sign in."
    );
  }

  const wantsAdmin = role === "ADMIN";
  const isAdminAccount = ADMIN_ROLES.includes(user.role);

  if (wantsAdmin && !isAdminAccount) {
    throw new ApiError(
      401,
      "This is a client account. Select 'Client' to sign in."
    );
  }

  if (!wantsAdmin && isAdminAccount) {
    throw new ApiError(
      401,
      "This is an administrator account. Select 'Administrator' to sign in."
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  return issueAuthResult(user);
}

// ---------------------------------------------------
// PASSWORD RESET
// ---------------------------------------------------

async function requestPasswordReset(identifier) {
  const user = await findUserByIdentifier(identifier);

  if (!user) {
    return { message: "If the account exists, a reset code has been sent." };
  }

  const otp = generateOtp();

  user.otp = {
    code: otp,
    purpose: "RESET_PASSWORD",
    expiresAt: otpExpiry(),
  };

  await user.save();

  return {
    message: "If the account exists, a reset code has been sent.",
    username: user.username,
    ...(env.isDevelopment ? { devOtp: otp } : {}),
  };
}

async function resetPassword(identifier, otp, newPassword) {
  const user = await findUserByIdentifier(identifier);

  if (!user) {
    throw new ApiError(400, "Invalid reset request.");
  }

  if (
    !user.otp ||
    user.otp.purpose !== "RESET_PASSWORD" ||
    user.otp.code !== String(otp).trim()
  ) {
    throw new ApiError(400, "Invalid reset code.");
  }

  if (user.otp.expiresAt < new Date()) {
    throw new ApiError(400, "Reset code expired. Request a new one.");
  }

  if (String(newPassword || "").length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }

  user.password = String(newPassword);
  user.otp = undefined;
  await user.save();

  return { message: "Password updated. Please sign in with your new password." };
}

// ---------------------------------------------------
// SESSION / PROFILE
// ---------------------------------------------------

async function getUserById(userId) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(404, "Account not found.");
  }

  return user.toSafeJSON();
}

async function updateProfile(userId, updates = {}) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "Account not found.");
  }

  if (typeof updates.name === "string" && updates.name.trim().length >= 2) {
    user.name = updates.name.trim();
  }

  if (typeof updates.mobile === "string") {
    user.mobile = updates.mobile.trim();
  }

  if (typeof updates.email === "string") {
    const email = updates.email.trim().toLowerCase();

    if (email && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });

      if (existing) {
        throw new ApiError(409, "This email is already registered.");
      }

      user.email = email;
    } else if (!email) {
      user.email = "";
    }
  }

  if (typeof updates.avatar === "string") {
    user.avatar = updates.avatar.trim();
  }

  await user.save();

  return user.toSafeJSON();
}

async function updateSettings(userId, settings = {}) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "Account not found.");
  }

  const current = user.settings || {};

  const next = {
    farmName:
      typeof settings.farmName === "string"
        ? settings.farmName.trim()
        : current.farmName,

    units:
      settings.units === "metric" || settings.units === "imperial"
        ? settings.units
        : current.units,

    notifications: {
      ...current.notifications,

      ...(typeof settings.notifications === "object" &&
      settings.notifications !== null
        ? {
            sensorAlerts: Boolean(
              settings.notifications.sensorAlerts ??
                current.notifications?.sensorAlerts ??
                true
            ),

            automationActions: Boolean(
              settings.notifications.automationActions ??
                current.notifications?.automationActions ??
                true
            ),

            marketplaceUpdates: Boolean(
              settings.notifications.marketplaceUpdates ??
                current.notifications?.marketplaceUpdates ??
                true
            ),
          }
        : {}),
    },

    thresholds: {
      ...current.thresholds,

      ...(typeof settings.thresholds === "object" &&
      settings.thresholds !== null
        ? Object.fromEntries(
            Object.entries(settings.thresholds)
              .filter(([, range]) => range && typeof range === "object")
              .map(([key, range]) => [
                key,
                {
                  min: Number(range.min),
                  max: Number(range.max),
                },
              ])
          )
        : {}),
    },
  };

  user.settings = next;
  user.markModified("settings");
  await user.save();

  return user.toSafeJSON();
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "Account not found.");
  }

  const matches = await user.comparePassword(String(currentPassword || ""));

  if (!matches) {
    throw new ApiError(400, "Current password is incorrect.");
  }

  if (String(newPassword || "").length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters.");
  }

  user.password = String(newPassword);
  await user.save();

  return { message: "Password changed successfully." };
}

module.exports = {
  generateToken,
  registerUser,
  verifyRegistrationOtp,
  resendOtp,
  loginUser,
  requestPasswordReset,
  resetPassword,
  getUserById,
  updateProfile,
  updateSettings,
  changePassword,
};
