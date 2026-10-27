/* =========================================================
   SEED SOURCE DATA
   Maps the HydroGrow client crop knowledge base into the
   Crop model, and defines the demo accounts.
   ========================================================= */

const parseRangeNumbers = (value) => {
  if (!value) {
    return null;
  }

  const match = String(value).match(
    /(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)/i
  );

  if (match) {
    return { min: Number(match[1]), max: Number(match[2]) };
  }

  const single = String(value).match(/(-?\d+(?:\.\d+)?)/);

  if (single) {
    const num = Number(single[1]);
    return { min: num, max: num };
  }

  return null;
};

const mapCropItem = (item) => {
  const growthRange = parseRangeNumbers(item.growthCycle);

  const harvestRange = parseRangeNumbers(item.harvestStart);

  const phRange = parseRangeNumbers(item.ph);

  const ecRange = parseRangeNumbers(item.ec);

  const tempRange = parseRangeNumbers(item.temperature);

  const humidityRange = parseRangeNumbers(item.humidity);

  const ppfdRange = parseRangeNumbers(item.ppfd);

  return {
    cropId: item.id,

    name: item.name,

    scientificName: item.scientificName || "",

    category: item.category || "",

    cropType: item.cropType || "",

    recommendedSystem: item.hydroponicSystem || "",

    growthCycleDays: growthRange ? growthRange.max : 45,

    harvestStartDays: harvestRange ? harvestRange.min : 1,

    parameters: {
      ph: phRange || { min: 5.5, max: 6.5 },

      ec: ecRange || { min: 0.8, max: 1.8 },

      temperature: tempRange || { min: 18, max: 25 },

      humidity: humidityRange || { min: 45, max: 80 },

      ppfd: ppfdRange || { min: 150, max: 250 },
    },

    photoperiod: item.photoperiod || "",

    description: item.description || "",

    image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : "",

    profile: item,

    isActive: true,
  };
};

const DEMO_USERS = [
  {
    name: "HydroGrow Admin",

    username: "admin",

    email: "admin@hydrogrow.app",

    password: "admin123",

    role: "ADMIN",

    isVerified: true,
  },

  {
    name: "Demo Grower",

    username: "hydrogrow",

    email: "grower@hydrogrow.app",

    password: "hydrogrow123",

    role: "USER",

    isVerified: true,
  },
];

module.exports = {
  parseRangeNumbers,
  mapCropItem,
  DEMO_USERS,
};
