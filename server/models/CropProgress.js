const mongoose = require("mongoose");

const cropProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },

    deviceId: {
      type: String,
      default: "",
    },

    startDate: {
      type: Date,
      required: true,
    },

    expectedHarvestDate: {
      type: Date,
      default: null,
    },

    currentDay: {
      type: Number,
      default: 1,
      min: 1,
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    stage: {
      type: String,
      enum: [
        "GERMINATION",
        "SEEDLING",
        "VEGETATIVE",
        "FLOWERING",
        "FRUITING",
        "HARVEST_READY",
        "COMPLETED",
      ],
      default: "GERMINATION",
    },

    status: {
      type: String,
      enum: [
        "HEALTHY",
        "WARNING",
        "CRITICAL",
      ],
      default: "HEALTHY",
    },

    notes: {
      type: String,
      default: "",
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

cropProgressSchema.index({
  userId: 1,
  cropId: 1,
});

module.exports = mongoose.model(
  "CropProgress",
  cropProgressSchema
);