const mongoose = require("mongoose");

const sensorReadingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    deviceId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      default: null,
    },

    cropName: {
      type: String,
      default: "",
      trim: true,
    },

    sensors: {
      ph: {
        type: Number,
        default: null,
      },

      ec: {
        type: Number,
        default: null,
      },

      temperature: {
        type: Number,
        default: null,
      },

      humidity: {
        type: Number,
        default: null,
      },

      moisture: {
        type: Number,
        default: null,
      },

      nitrogen: {
        type: Number,
        default: null,
      },

      phosphorus: {
        type: Number,
        default: null,
      },

      potassium: {
        type: Number,
        default: null,
      },

      ppfd: {
        type: Number,
        default: null,
      },
    },

    status: {
      type: String,
      enum: ["Healthy", "Warning", "Critical"],
      default: "Healthy",
      index: true,
    },

    statusReasons: {
      type: [String],
      default: [],
    },

    source: {
      type: String,
      enum: [
        "HARDWARE",
        "INPUT_SIMULATOR",
        "MANUAL",
        "API",
      ],
      default: "HARDWARE",
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

sensorReadingSchema.index({
  deviceId: 1,
  timestamp: -1,
});

module.exports = mongoose.model(
  "SensorReading",
  sensorReadingSchema
);