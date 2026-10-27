const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      default: "",
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "SENSOR",
        "SYSTEM",
        "AUTOMATION",
        "CROP",
      ],
      default: "SENSOR",
    },

    severity: {
      type: String,
      enum: [
        "INFO",
        "WARNING",
        "CRITICAL",
      ],
      default: "INFO",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    sensor: {
      type: String,
      default: "",
    },

    value: {
      type: Number,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    isResolved: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alert", alertSchema);