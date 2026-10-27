const mongoose = require("mongoose");

const automationRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deviceId: {
      type: String,
      default: "",
    },

    sensor: {
      type: String,
      required: true,
      enum: [
        "ph",
        "ec",
        "temperature",
        "humidity",
        "moisture",
        "nitrogen",
        "phosphorus",
        "potassium",
        "ppfd",
      ],
    },

    condition: {
      type: String,
      required: true,
      enum: [
        "GREATER_THAN",
        "LESS_THAN",
        "GREATER_THAN_EQUAL",
        "LESS_THAN_EQUAL",
        "EQUAL",
      ],
    },

    threshold: {
      type: Number,
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "PUMP_ON",
        "PUMP_OFF",
        "FAN_ON",
        "FAN_OFF",
        "LIGHT_ON",
        "LIGHT_OFF",
        "ALERT",
      ],
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    lastTriggeredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AutomationRule",
  automationRuleSchema
);