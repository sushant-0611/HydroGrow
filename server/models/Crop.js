const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
  {
    cropId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    scientificName: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    cropType: {
      type: String,
      default: "",
      trim: true,
    },

    recommendedSystem: {
      type: String,
      default: "",
      trim: true,
    },

    growthCycleDays: {
      type: Number,
      required: true,
      min: 1,
    },

    harvestStartDays: {
      type: Number,
      default: 1,
      min: 1,
    },

    parameters: {
      ph: {
        min: Number,
        max: Number,
      },

      ec: {
        min: Number,
        max: Number,
      },

      temperature: {
        min: Number,
        max: Number,
      },

      humidity: {
        min: Number,
        max: Number,
      },

      ppfd: {
        min: Number,
        max: Number,
      },

      nitrogen: {
        min: Number,
        max: Number,
      },

      phosphorus: {
        min: Number,
        max: Number,
      },

      potassium: {
        min: Number,
        max: Number,
      },

      moisture: {
        min: Number,
        max: Number,
      },
    },

    photoperiod: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    profile: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Crop", cropSchema);