const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: [
        "USER",
        "FARMER",
        "ADMIN",
        "SUPER_ADMIN",
      ],
      default: "USER",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
      default: "",
    },

    otp: {
      code: {
        type: String,
        default: null,
      },

      purpose: {
        type: String,
        enum: [
          "REGISTER",
          "RESET_PASSWORD",
          null,
        ],
        default: null,
      },

      expiresAt: {
        type: Date,
        default: null,
      },
    },

    settings: {
      farmName: {
        type: String,
        default: "My HydroGrow Farm",
      },

      units: {
        type: String,
        enum: ["metric", "imperial"],
        default: "metric",
      },

      notifications: {
        sensorAlerts: {
          type: Boolean,
          default: true,
        },

        automationActions: {
          type: Boolean,
          default: true,
        },

        marketplaceUpdates: {
          type: Boolean,
          default: true,
        },
      },

      thresholds: {
        ph: {
          min: { type: Number, default: 5.5 },
          max: { type: Number, default: 6.5 },
        },

        ec: {
          min: { type: Number, default: 1.2 },
          max: { type: Number, default: 2.2 },
        },

        temperature: {
          min: { type: Number, default: 20 },
          max: { type: Number, default: 28 },
        },
      },
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    username: this.username,
    email: this.email,
    mobile: this.mobile,
    role: this.role,
    isActive: this.isActive,
    isVerified: this.isVerified,
    avatar: this.avatar,
    settings: this.settings,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
