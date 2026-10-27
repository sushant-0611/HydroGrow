const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const listUsers = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;

  const query = {};

  if (search) {
    const regex = new RegExp(String(search).trim(), "i");

    query.$or = [{ name: regex }, { username: regex }, { email: regex }];
  }

  if (role && role !== "ALL") {
    query.role = role;
  }

  if (status === "ACTIVE") {
    query.isActive = true;
  } else if (status === "INACTIVE") {
    query.isActive = false;
  }

  const users = await User.find(query).sort({ createdAt: -1 }).limit(500);

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map((user) => user.toSafeJSON()),
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  res.status(200).json({ success: true, user: user.toSafeJSON() });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const { name, mobile, email, role, isActive } = req.body || {};

  if (typeof name === "string" && name.trim().length >= 2) {
    user.name = name.trim();
  }

  if (typeof mobile === "string") {
    user.mobile = mobile.trim();
  }

  if (typeof email === "string") {
    user.email = email.trim().toLowerCase();
  }

  if (role && ["USER", "FARMER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    if (role !== user.role && req.user.role !== "SUPER_ADMIN") {
      throw new ApiError(
        403,
        "Only a super admin can change account roles."
      );
    }

    user.role = role;
  }

  if (typeof isActive === "boolean") {
    if (!isActive && String(user._id) === String(req.user._id)) {
      throw new ApiError(400, "You cannot deactivate your own account.");
    }

    user.isActive = isActive;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "User updated.",
    user: user.toSafeJSON(),
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot delete your own account.");
  }

  await user.deleteOne();

  res.status(200).json({ success: true, message: "User deleted." });
});

const adminStats = asyncHandler(async (req, res) => {
  const [totalUsers, activeUsers, adminUsers] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: { $in: ADMIN_ROLES } }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      adminUsers,
      clientUsers: totalUsers - adminUsers,
    },
  });
});

module.exports = {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  adminStats,
};
