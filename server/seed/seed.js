/* eslint-disable no-console */

const mongoose = require("mongoose");

const path = require("path");

const { pathToFileURL } = require("url");

const env = require("../config/env");

const connectDB = require("../config/db");

const User = require("../models/User");

const Crop = require("../models/Crop");

const UserCrop = require("../models/UserCrop");

const MarketplaceProduct = require("../models/MarketplaceProduct");

const AutomationRule = require("../models/AutomationRule");

const Alert = require("../models/Alert");

const SensorReading = require("../models/SensorReading");

const Order = require("../models/Order");

const { mapCropItem, DEMO_USERS } = require("./adminData");

const CLIENT_CROP_DATA_PATH = path.resolve(
  __dirname,
  "../../client/src/data/cropData.js"
);

const upsertUsers = async () => {
  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ username: demo.username });

    if (existing) {
      existing.role = demo.role;
      existing.isVerified = true;
      existing.isActive = true;
      await existing.save();
      console.log(`  ✓ user updated: ${demo.username} (${demo.role})`);
    } else {
      await User.create(demo);
      console.log(`  ✓ user created: ${demo.username} (${demo.role})`);
    }
  }
};

const seedCrops = async (cropItems) => {
  const mapped = cropItems.map(mapCropItem);

  await Crop.deleteMany({});

  await Crop.insertMany(mapped);

  console.log(`  ✓ crops seeded: ${mapped.length}`);
};

const seedDemoFarm = async () => {
  const grower = await User.findOne({ username: "hydrogrow" });

  if (!grower) {
    console.log("  • grower missing — skipping farm demo data");
    return;
  }

  await UserCrop.deleteMany({ userId: grower._id });

  const lettuce = await Crop.findOne({ cropId: "HG001" });

  const spinach = await Crop.findOne({ cropId: "HG002" });

  const farmCrops = [];

  if (lettuce) {
    const profile = lettuce.profile || {};

    farmCrops.push({
      userId: grower._id,

      cropKey: lettuce.cropId,

      cropRef: lettuce._id,

      name: lettuce.name,

      category: lettuce.category,

      scientificName: lettuce.scientificName,

      cropType: lettuce.cropType,

      hydroponicSystem: lettuce.recommendedSystem,

      growthCycle: profile.growthCycle || "",

      harvestStart: profile.harvestStart || "",

      difficulty: profile.difficulty || "",

      demand: profile.demand || "",

      phase: profile.phase || "",

      description: lettuce.description,

      harvestGuidance: profile.harvestGuidance || "",

      requirements: {
        ph: profile.ph || "",

        ec: profile.ec || "",

        temperature: profile.temperature || "",

        humidity: profile.humidity || "",

        photoperiod: profile.photoperiod || "",

        ppfd: profile.ppfd || "",
      },

      farmUnit: "NFT Rack 1",

      plantCount: 24,

      plantingDate: new Date(Date.now() - 12 * 86400000)
        .toISOString()
        .split("T")[0],

      notes: "Demo lettuce bed — NFT channels.",

      device: {
        deviceId: "HYDROGROW-SIM-001",

        source: "INPUT_SIMULATOR",

        connected: false,

        lastUpdate: null,
      },

      automation: {
        mode: "automatic",

        enabled: true,

        lastAction: null,

        lastActionAt: null,
      },
    });
  }

  if (spinach) {
    const profile = spinach.profile || {};

    farmCrops.push({
      userId: grower._id,

      cropKey: spinach.cropId,

      cropRef: spinach._id,

      name: spinach.name,

      category: spinach.category,

      scientificName: spinach.scientificName,

      cropType: spinach.cropType,

      hydroponicSystem: spinach.recommendedSystem,

      growthCycle: profile.growthCycle || "",

      harvestStart: profile.harvestStart || "",

      difficulty: profile.difficulty || "",

      demand: profile.demand || "",

      phase: profile.phase || "",

      description: spinach.description,

      harvestGuidance: profile.harvestGuidance || "",

      requirements: {
        ph: profile.ph || "",

        ec: profile.ec || "",

        temperature: profile.temperature || "",

        humidity: profile.humidity || "",

        photoperiod: profile.photoperiod || "",

        ppfd: profile.ppfd || "",
      },

      farmUnit: "DWC Bed 2",

      plantCount: 16,

      plantingDate: new Date(Date.now() - 5 * 86400000)
        .toISOString()
        .split("T")[0],

      notes: "",

      device: {
        deviceId: "HYDROGROW-SIM-001",

        source: "INPUT_SIMULATOR",

        connected: false,

        lastUpdate: null,
      },

      automation: {
        mode: "automatic",

        enabled: true,

        lastAction: null,

        lastActionAt: null,
      },
    });
  }

  if (farmCrops.length > 0) {
    await UserCrop.insertMany(farmCrops);
    console.log(`  ✓ farm crops seeded: ${farmCrops.length}`);
  }
};

const seedMarketplace = async () => {
  const grower = await User.findOne({ username: "hydrogrow" });

  if (!grower) {
    return;
  }

  await MarketplaceProduct.deleteMany({ sellerId: grower._id });

  await MarketplaceProduct.create([
    {
      sellerId: grower._id,

      cropName: "Lettuce",

      title: "Fresh Butterhead Lettuce — hydroponic, pesticide-free",

      description:
        "Crisp butterhead lettuce grown in a clean NFT system. Harvested to order.",

      quantity: 12,

      unit: "kg",

      price: 120,

      location: "Pune, MH",

      image: "/images/crops/Lettuce1.jpg",

      status: "AVAILABLE",
    },

    {
      sellerId: grower._id,

      cropName: "Spinach",

      title: "Baby Spinach — 500g packs",

      description: "Tender baby spinach, packed the same day as harvest.",

      quantity: 8,

      unit: "kg",

      price: 160,

      location: "Pune, MH",

      image: "/images/crops/Spinach1.jpg",

      status: "AVAILABLE",
    },
  ]);

  console.log("  ✓ marketplace listings seeded: 2");
};

const seedAutomation = async () => {
  const grower = await User.findOne({ username: "hydrogrow" });

  if (!grower) {
    return;
  }

  await AutomationRule.deleteMany({ userId: grower._id });

  await AutomationRule.create([
    {
      name: "Low pH alert",

      userId: grower._id,

      deviceId: "HYDROGROW-SIM-001",

      sensor: "ph",

      condition: "LESS_THAN",

      threshold: 5.5,

      action: "ALERT",

      enabled: true,
    },

    {
      name: "High temperature pump",

      userId: grower._id,

      deviceId: "HYDROGROW-SIM-001",

      sensor: "temperature",

      condition: "GREATER_THAN",

      threshold: 27,

      action: "PUMP_ON",

      enabled: true,
    },
  ]);

  console.log("  ✓ automation rules seeded: 2");
};

const run = async () => {
  console.log("");

  console.log("🌱 HYDROGROW DATABASE SEED");

  console.log("==========================");

  try {
    await connectDB();

    const module = await import(pathToFileURL(CLIENT_CROP_DATA_PATH));

    const cropItems = module.crops || module.default || [];

    console.log("");

    console.log("Seeding users...");

    await upsertUsers();

    console.log("");

    console.log("Seeding crop knowledge base...");

    await seedCrops(cropItems);

    console.log("");

    console.log("Seeding demo farm, marketplace, automation...");

    await seedDemoFarm();

    await seedMarketplace();

    await seedAutomation();

    console.log("");

    console.log("✅ Seed complete.");

    console.log("");

    console.log("Demo logins:");

    console.log("  Admin  → admin / admin123 (Administrator)");

    console.log("  Client → hydrogrow / hydrogrow123 (Client)");

    console.log("");
  } catch (error) {
    console.error("❌ Seed failed:", error.message);

    if (env.isDevelopment) {
      console.error(error.stack);
    }

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
