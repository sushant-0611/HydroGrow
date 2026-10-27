const mongoose = require("mongoose");

/* =========================================================
   GROWTH RECORD
   A photo-based crop growth verification. The simulator
   classifies a crop photo into a growth stage 1-5 and the
   sensor ingest pipeline stores it here so the farm view
   can show the latest verification per farm crop.
   ========================================================= */

const growthRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserCrop",
      default: null,
    },

    deviceId: {
      type: String,
      default: "",
      trim: true,
    },

    cropKey: {
      type: String,
      required: true,
      trim: true,
    },

    cropName: {
      type: String,
      default: "",
      trim: true,
    },

    stage: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    stageName: {
      type: String,
      default: "",
      trim: true,
    },

    confidence: {
      type: Number,
      default: 0,
    },

    expectedStage: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    expectedStageName: {
      type: String,
      default: null,
    },

    dayNumber: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ["ON_TRACK", "AHEAD", "BEHIND"],
      default: "ON_TRACK",
    },

    source: {
      type: String,
      default: "PHOTO_ANALYSIS",
    },

    verifiedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

growthRecordSchema.index({
  userId: 1,
  cropKey: 1,
  verifiedAt: -1,
});

module.exports = mongoose.model(
  "GrowthRecord",
  growthRecordSchema
);
