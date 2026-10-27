// client/src/data/adminData.js
//
// Mock platform-administration layer for the HydroGrow admin panel.
// Users merge: localStorage-registered accounts (hydrogrow_users)
// + built-in demo accounts + seeded demo profiles. Status/role
// changes and deletions are stored as overrides so the real auth
// storage (hydrogrow_users) is never mutated from the admin panel.

import { crops } from "./cropData";

import {
  getAllListings,
  getAllOrders,
  getListingStatus,
} from "./marketplaceData";

/* =========================================================
   STORAGE KEYS
   ========================================================= */

const USER_OVERRIDES_KEY = "hydrogrow_admin_user_overrides";
const ALERTS_STORAGE_KEY = "hydrogrow_admin_alerts";
const ACTIVITY_STORAGE_KEY = "hydrogrow_admin_activity";

const ACTIVITY_LIMIT = 40;

/* =========================================================
   TIME HELPERS
   ========================================================= */

function daysAgo(days, hours = 0) {
  const date = new Date();

  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - hours);

  return date.toISOString();
}

export function formatAdminDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatAdminDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${formatAdminDate(value)} · ${date.toLocaleTimeString(
    "en-IN",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

export function formatAdminRelative(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const minutes = Math.floor(
    (Date.now() - date.getTime()) / 60000
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  return formatAdminDate(value);
}

/* =========================================================
   STORAGE HELPERS
   ========================================================= */

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* =========================================================
   SEEDED PROFILES
   ========================================================= */

const SEED_USERS = [
  {
    id: "HG-SEED-101",
    name: "Aarav Patil",
    username: "aarav.p",
    mobile: "9822011223",
    role: "USER",
    status: "active",
    joinedAt: daysAgo(64),
    lastActive: daysAgo(0, 2),
    source: "seed",
  },
  {
    id: "HG-SEED-102",
    name: "Priya Deshmukh",
    username: "priya.d",
    mobile: "9822014455",
    role: "USER",
    status: "active",
    joinedAt: daysAgo(38),
    lastActive: daysAgo(1),
    source: "seed",
  },
  {
    id: "HG-SEED-103",
    name: "Rohan Kadam",
    username: "rohan.k",
    mobile: "9822077889",
    role: "USER",
    status: "suspended",
    joinedAt: daysAgo(52),
    lastActive: daysAgo(6),
    source: "seed",
  },
  {
    id: "HG-SEED-104",
    name: "Sneha Joshi",
    username: "sneha.j",
    mobile: "9822099001",
    role: "USER",
    status: "active",
    joinedAt: daysAgo(27),
    lastActive: daysAgo(0, 5),
    source: "seed",
  },
  {
    id: "HG-SEED-105",
    name: "Vikram Shinde",
    username: "vikram.s",
    mobile: "9822012340",
    role: "ADMIN",
    status: "active",
    joinedAt: daysAgo(90),
    lastActive: daysAgo(2),
    source: "seed",
  },
  {
    id: "HG-SEED-106",
    name: "Meera Iyer",
    username: "meera.i",
    mobile: "9822055667",
    role: "USER",
    status: "active",
    joinedAt: daysAgo(12),
    lastActive: daysAgo(1, 4),
    source: "seed",
  },
  {
    id: "HG-SEED-107",
    name: "Kunal Bhosale",
    username: "kunal.b",
    mobile: "9822033445",
    role: "USER",
    status: "suspended",
    joinedAt: daysAgo(5),
    lastActive: daysAgo(4),
    source: "seed",
  },
];

const DEMO_PLATFORM_USERS = [
  {
    id: "HG-DEMO-001",
    name: "HydroGrow User",
    username: "hydrogrow",
    mobile: "9876543210",
    role: "USER",
    status: "active",
    joinedAt: daysAgo(120),
    lastActive: new Date().toISOString(),
    source: "demo",
  },
  {
    id: "HG-ADMIN-001",
    name: "HydroGrow Admin",
    username: "admin",
    mobile: "9876543211",
    role: "ADMIN",
    status: "active",
    joinedAt: daysAgo(150),
    lastActive: new Date().toISOString(),
    source: "demo",
  },
];

/* =========================================================
   USER MANAGEMENT
   ========================================================= */

function readOverrides() {
  return readJson(USER_OVERRIDES_KEY, {});
}

function writeOverrides(overrides) {
  writeJson(USER_OVERRIDES_KEY, overrides);
}

export function getPlatformUsers() {
  const registered = readJson("hydrogrow_users", []).map(
    (user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      mobile: user.mobile,
      role: user.role || "USER",
      status: "active",
      joinedAt: user.joinedAt || user.createdAt || null,
      lastActive: user.lastActive || null,
      source: "registered",
    })
  );

  const merged = [];
  const seen = new Set();

  for (const user of [
    ...registered,
    ...DEMO_PLATFORM_USERS,
    ...SEED_USERS,
  ]) {
    if (!user?.username || seen.has(user.username)) {
      continue;
    }

    seen.add(user.username);
    merged.push(user);
  }

  const overrides = readOverrides();
  const result = [];

  for (const user of merged) {
    const override = overrides[user.username];

    if (override?.deleted) {
      continue;
    }

    result.push({
      ...user,
      role: override?.role || user.role,
      status: override?.status || user.status,
    });
  }

  return result;
}

export function setUserStatus(username, status) {
  if (!username) {
    return null;
  }

  const overrides = readOverrides();

  overrides[username] = {
    ...overrides[username],
    status,
  };

  writeOverrides(overrides);

  pushActivity(
    status === "suspended"
      ? "bi-person-slash"
      : "bi-person-check",
    `${username} was ${
      status === "suspended" ? "suspended" : "reactivated"
    } by the admin team`
  );

  return getPlatformUsers();
}

export function setUserRole(username, role) {
  if (!username || !["USER", "ADMIN"].includes(role)) {
    return null;
  }

  const overrides = readOverrides();

  overrides[username] = {
    ...overrides[username],
    role,
  };

  writeOverrides(overrides);

  pushActivity(
    "bi-shield-lock",
    `${username} role changed to ${role}`
  );

  return getPlatformUsers();
}

export function deletePlatformUser(username) {
  if (!username) {
    return { success: false, message: "Missing user." };
  }

  if (username === "admin") {
    return {
      success: false,
      message:
        "The primary admin account cannot be deleted.",
    };
  }

  const overrides = readOverrides();

  overrides[username] = {
    ...overrides[username],
    deleted: true,
  };

  writeOverrides(overrides);

  pushActivity(
    "bi-person-dash",
    `${username} was removed from the platform`
  );

  return { success: true };
}

/* =========================================================
   USER STATUS META
   ========================================================= */

export const USER_STATUS_META = {
  active: {
    label: "Active",
    icon: "bi-person-check",
  },
  suspended: {
    label: "Suspended",
    icon: "bi-person-slash",
  },
};

export const USER_SOURCE_META = {
  registered: {
    label: "Registered",
    icon: "bi-person-plus",
  },
  demo: {
    label: "Demo",
    icon: "bi-stars",
  },
  seed: {
    label: "Seed",
    icon: "bi-collection",
  },
};

/* =========================================================
   SYSTEM ALERTS
   ========================================================= */

export const ALERT_SEVERITY_META = {
  info: {
    label: "Info",
    icon: "bi-info-circle",
  },
  warning: {
    label: "Warning",
    icon: "bi-exclamation-triangle",
  },
  critical: {
    label: "Critical",
    icon: "bi-exclamation-octagon",
  },
};

const SEED_ALERTS = [
  {
    id: "HG-ALT-001",
    severity: "info",
    title: "Sensor unit heartbeat restored",
    message:
      "Sensor unit HYDROGROW-SIM-001 reconnected and is streaming live readings again.",
    source: "Device Network",
    createdAt: daysAgo(0, 1),
    acknowledged: false,
  },
  {
    id: "HG-ALT-002",
    severity: "warning",
    title: "EC sensor drift detected",
    message:
      "EC readings from HYDROGROW-SIM-001 drifted beyond the expected band for more than 30 minutes. Recalibration recommended.",
    source: "Analytics Engine",
    createdAt: daysAgo(0, 4),
    acknowledged: false,
  },
  {
    id: "HG-ALT-003",
    severity: "critical",
    title: "Transmission gap on device",
    message:
      "No sensor transmissions received for 2 intervals. Check the device power state on the control panel.",
    source: "Device Network",
    createdAt: daysAgo(1),
    acknowledged: false,
  },
  {
    id: "HG-ALT-004",
    severity: "info",
    title: "Marketplace listing under review",
    message:
      "A fresh-produce listing was flagged for a routine quality review. No action required yet.",
    source: "Marketplace",
    createdAt: daysAgo(2),
    acknowledged: true,
  },
  {
    id: "HG-ALT-005",
    severity: "warning",
    title: "Nutrient stock running low",
    message:
      "Average nutrient stock across active listings is below the recommended threshold for the lettuce cycle.",
    source: "Inventory Watch",
    createdAt: daysAgo(3),
    acknowledged: false,
  },
  {
    id: "HG-ALT-006",
    severity: "info",
    title: "Platform backup completed",
    message:
      "Nightly platform backup finished successfully with zero conflicts.",
    source: "System",
    createdAt: daysAgo(3, 6),
    acknowledged: true,
  },
];

export function getSystemAlerts() {
  const alerts = readJson(ALERTS_STORAGE_KEY, null);

  if (Array.isArray(alerts)) {
    return alerts;
  }

  writeJson(ALERTS_STORAGE_KEY, SEED_ALERTS);

  return SEED_ALERTS;
}

function saveAlerts(alerts) {
  writeJson(ALERTS_STORAGE_KEY, alerts);
}

export function acknowledgeAlert(id) {
  const alerts = getSystemAlerts().map((alert) =>
    alert.id === id
      ? { ...alert, acknowledged: true }
      : alert
  );

  saveAlerts(alerts);

  return alerts;
}

export function acknowledgeAllAlerts() {
  const alerts = getSystemAlerts().map((alert) => ({
    ...alert,
    acknowledged: true,
  }));

  saveAlerts(alerts);

  return alerts;
}

export function dismissAlert(id) {
  const alerts = getSystemAlerts().filter(
    (alert) => alert.id !== id
  );

  saveAlerts(alerts);

  return alerts;
}

/* =========================================================
   ACTIVITY LOG
   ========================================================= */

const SEED_ACTIVITY = [
  {
    id: "HG-ACT-001",
    icon: "bi-broadcast",
    text: "Sensor unit HYDROGROW-SIM-001 heartbeat restored",
    at: daysAgo(0, 1),
  },
  {
    id: "HG-ACT-002",
    icon: "bi-bag-check",
    text: "New marketplace order placed by HydroGrow User",
    at: daysAgo(0, 3),
  },
  {
    id: "HG-ACT-003",
    icon: "bi-flower1",
    text: "Lettuce (HG001) growth milestone recorded",
    at: daysAgo(1, 2),
  },
  {
    id: "HG-ACT-004",
    icon: "bi-person-plus",
    text: "Meera Iyer joined the platform",
    at: daysAgo(1, 6),
  },
  {
    id: "HG-ACT-005",
    icon: "bi-exclamation-triangle",
    text: "EC drift warning raised by the analytics engine",
    at: daysAgo(2),
  },
  {
    id: "HG-ACT-006",
    icon: "bi-shop",
    text: "Fresh produce listing published on the marketplace",
    at: daysAgo(2, 8),
  },
  {
    id: "HG-ACT-007",
    icon: "bi-shield-check",
    text: "Nightly platform backup completed",
    at: daysAgo(3),
  },
  {
    id: "HG-ACT-008",
    icon: "bi-cpu",
    text: "Automation rule 'Night lighting' executed",
    at: daysAgo(3, 5),
  },
];

export function getActivityLog() {
  const activity = readJson(ACTIVITY_STORAGE_KEY, null);

  if (Array.isArray(activity)) {
    return activity;
  }

  writeJson(ACTIVITY_STORAGE_KEY, SEED_ACTIVITY);

  return SEED_ACTIVITY;
}

export function pushActivity(icon, text) {
  const activity = getActivityLog();

  activity.unshift({
    id: `HG-ACT-${Date.now()}`,
    icon,
    text,
    at: new Date().toISOString(),
  });

  writeJson(
    ACTIVITY_STORAGE_KEY,
    activity.slice(0, ACTIVITY_LIMIT)
  );
}

/* =========================================================
   PLATFORM STATS
   ========================================================= */

export function getPlatformStats() {
  const users = getPlatformUsers();
  const listings = getAllListings();
  const orders = getAllOrders();
  const alerts = getSystemAlerts();

  const activeListings = listings.filter(
    (listing) => getListingStatus(listing) === "active"
  );

  const liveOrders = orders.filter(
    (order) => order.status !== "cancelled"
  );

  return {
    totalUsers: users.length,
    activeUsers: users.filter(
      (user) => user.status === "active"
    ).length,
    suspendedUsers: users.filter(
      (user) => user.status === "suspended"
    ).length,
    adminUsers: users.filter(
      (user) => user.role === "ADMIN"
    ).length,

    totalListings: listings.length,
    activeListings: activeListings.length,
    pausedListings: listings.filter(
      (listing) => listing.status === "paused"
    ).length,

    totalOrders: orders.length,
    openOrders: orders.filter(
      (order) => order.status === "placed"
    ).length,
    inTransitOrders: orders.filter(
      (order) => order.status === "shipped"
    ).length,
    deliveredOrders: orders.filter(
      (order) => order.status === "delivered"
    ).length,
    cancelledOrders: orders.filter(
      (order) => order.status === "cancelled"
    ).length,
    grossRevenue: liveOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    ),

    cropsTracked: crops.length,
    unresolvedAlerts: alerts.filter(
      (alert) => !alert.acknowledged
    ).length,

    recentOrders: orders.slice(0, 5),
  };
}
