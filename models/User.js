const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, sparse: true },
    passwordHash: { type: String, required: true },

    avatar: { type: String }, // S3 URL

    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },

    verification: {
      email: { type: Boolean, default: false },
      phone: { type: Boolean, default: false },
      institution: { type: Boolean, default: false }, // school/barangay ID verified
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      label: { type: String }, // e.g. "Calasiao, Pangasinan"
    },

    defaultRadius: {
      type: Number,
      default: 1000, // meters
      enum: [500, 1000, 3000, 5000, 10000],
    },

    trust: {
      score: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0 },
      completedTransactions: { type: Number, default: 0 },
      successfulHandoffs: { type: Number, default: 0 },
      returnedItems: { type: Number, default: 0 },
      cancellations: { type: Number, default: 0 },
      reportCount: { type: Number, default: 0 },
      label: {
        type: String,
        enum: [
          "New User",
          "Verified User",
          "Reliable Helper",
          "Good Borrower",
          "Trusted Lender",
          "Trusted Community Member",
        ],
        default: "New User",
      },
    },

    savedSearches: [
      {
        keyword: String,
        category: String,
        radius: Number,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Geospatial index for location-based queries
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
