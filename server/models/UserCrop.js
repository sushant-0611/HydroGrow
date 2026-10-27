const mongoose = require("mongoose");

/* =========================================================
   USER FARM CROP
   A crop a grower has added to "My Farm" — mirrors the
   farmCrop object used by the HydroGrow client.
   ========================================================= */

const userCropSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    cropKey: {
      type: String,
      required: true,
      trim: true,
    },

    cropRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      default: null,
    },

    /* ---------------------------------------------
       DENORMALIZED KNOWLEDGE-BASE SNAPSHOT
       --------------------------------------------- */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    scientificName: {
      type: String,
      default: "",
      trim: true,
    },

    cropType: {
      type: String,
      default: "",
      trim: true,
    },

    hydroponicSystem: {
      type: String,
      default: "",
      trim: true,
    },

    growthCycle: {
      type: String,
      default: "",
      trim: true,
    },

    harvestStart: {
      type: String,
      default: "",
      trim: true,
    },

    difficulty: {
      type: String,
      default: "",
      trim: true,
    },

    demand: {
      type: String,
      default: "",
      trim: true,
    },

    phase: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    harvestGuidance: {
      type: String,
      default: "",
      trim: true,
    },

    requirements: {
      ph: { type: String, default: "" },
      ec: { type: String, default: "" },
      temperature: { type: String, default: "" },
      humidity: { type: String, default: "" },
      photoperiod: { type: String, default: "" },
      ppfd: { type: String, default: "" },
    },

    /* ---------------------------------------------
       FARM SETUP
       --------------------------------------------- */

    farmUnit: {
      type: String,
      default: "My Farm",
      trim: true,
    },

    plantCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    plantingDate: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    /* ---------------------------------------------
       LIVE STATE
       --------------------------------------------- */

    status: {
      type: String,
      enum: ["healthy", "warning", "critical"],
      default: "healthy",
    },

    device: {
      deviceId: {
        type: String,
        default: "HYDROGROW-SIM-001",
      },

      source: {
        type: String,
        default: "INPUT_SIMULATOR",
      },

      connected: {
        type: Boolean,
        default: false,
      },

      lastUpdate: {
        type: Date,
        default: null,
      },
    },

    automation: {
      mode: {
        type: String,
        enum: ["automatic", "manual"],
        default: "automatic",
      },

      enabled: {
        type: Boolean,
        default: true,
      },

      lastAction: {
        type: String,
        default: null,
      },

      lastActionAt: {
        type: Date,
        default: null,
      },
    },

    growth: {
      currentDay: {
        type: Number,
        default: 1,
        min: 1,
      },

      currentStage: {
        type: String,
        default: "Seed / Germination",
      },

      estimatedDaysRemaining: {
        type: Number,
        default: 0,
      },

      harvestReady: {
        type: Boolean,
        default: false,
      },

      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    alertSummary: {
      activeCount: {
        type: Number,
        default: 0,
      },

      criticalCount: {
        type: Number,
        default: 0,
      },

      warningCount: {
        type: Number,
        default: 0,
      },

      lastAlert: {
        type: Date,
        default: null,
      },
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

userCropSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model("UserCrop", userCropSchema);
