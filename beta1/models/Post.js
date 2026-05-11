const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["favor", "errand", "question"],
      required: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 1000 },
    category: { type: String }, // e.g. "Printing", "Food", "Info", "Transport"

    // For favors/errands
    payment: {
      offered: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "PHP" },
      note: { type: String }, // e.g. "negotiable", "tip only"
    },

    deadline: { type: Date },

    proofRequired: {
      required: { type: Boolean, default: false },
      description: { type: String }, // e.g. "Photo of receipt"
    },

    images: [{ type: String }], // S3 URLs

    // Location
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    radius: { type: Number, required: true }, // meters — visibility range
    locationLabel: { type: String }, // e.g. "Near CHED Pangasinan"

    status: {
      type: String,
      enum: ["open", "accepted", "in_progress", "completed", "cancelled", "expired"],
      default: "open",
    },

    acceptedApplicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    applicants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        proposal: { type: String },
        appliedAt: { type: Date, default: Date.now },
      },
    ],

    // For questions
    answers: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        label: {
          type: String,
          enum: ["Helpful", "Confirmed", "Outdated", "Not Accurate", "Needs Update"],
        },
        confirmations: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    expiresAt: { type: Date }, // auto-expire posts
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

postSchema.index({ location: "2dsphere" });
postSchema.index({ status: 1, type: 1 });
postSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model("Post", postSchema);
