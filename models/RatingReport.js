const mongoose = require("mongoose");

// ─── Rating ───────────────────────────────────────────────────────────────────

const ratingSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, maxlength: 400 },
    tags: [
      {
        type: String,
        enum: [
          "On time",
          "Communicative",
          "Trustworthy",
          "Item as described",
          "Good handoff",
          "Would transact again",
          "Late",
          "No show",
          "Item damaged",
          "Poor communication",
        ],
      },
    ],
  },
  { timestamps: true }
);

ratingSchema.index({ ratee: 1 });
ratingSchema.index({ transaction: 1, rater: 1 }, { unique: true }); // one rating per user per transaction

// ─── Report ───────────────────────────────────────────────────────────────────

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetType: {
      type: String,
      enum: ["post", "item", "lost_found", "message", "user"],
      required: true,
    },

    // Only one of these will be set
    targetPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    targetItem: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    targetLostFound: { type: mongoose.Schema.Types.ObjectId, ref: "LostFound" },
    targetMessage: { type: String }, // message ID within a conversation
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    reason: {
      type: String,
      enum: [
        "Scam",
        "Harassment",
        "Unsafe item",
        "Fake post",
        "No show",
        "Payment issue",
        "Inappropriate message",
        "Privacy violation",
        "False information",
        "Spam",
        "Illegal item",
        "Other",
      ],
      required: true,
    },

    details: { type: String, maxlength: 600 },

    status: {
      type: String,
      enum: ["pending", "under_review", "actioned", "dismissed"],
      default: "pending",
    },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, targetType: 1 });
reportSchema.index({ reporter: 1 });

const Rating = mongoose.model("Rating", ratingSchema);
const Report = mongoose.model("Report", reportSchema);

module.exports = { Rating, Report };
