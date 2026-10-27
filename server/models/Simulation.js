const mongoose = require("mongoose");

const simulationSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },

    crop: {
      type: String,
      default: "Lettuce",
      trim: true,
    },

    sensors: {
      ph: Number,
      ec: Number,
      temperature: Number,
      humidity: Number,
      moisture: Number,
      nitrogen: Number,
      phosphorus: Number,
      potassium: Number,
      ppfd: Number,
    },

    status: {
      type: String,
      enum: [
        "Healthy",
        "Warning",
        "Critical",
      ],
      default: "Healthy",
    },

    source: {
      type: String,
      default: "INPUT_SIMULATOR",
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

simulationSchema.index({
  deviceId: 1,
  timestamp: -1,
});

module.exports = mongoose.model(
  "Simulation",
  simulationSchema
);