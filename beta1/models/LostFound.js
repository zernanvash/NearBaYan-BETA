const mongoose = require("mongoose");

const lostFoundSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reportType: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },

    category: {
      type: String,
      enum: ["ID", "Wallet", "Phone", "Keys", "Bag", "Document", "Clothing", "Tumbler", "Others"],
      required: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    // Public description — must NOT contain sensitive info
    publicDescription: { type: String, required: true, maxlength: 600 },

    // Private description — only shown to reporter and verified claimant
    privateDescription: { type: String, maxlength: 600 },

    images: {
      // Original images — only visible to reporter
      original: [{ type: String }],
      // Blurred/redacted versions — shown publicly
      blurred: [{ type: String }],
    },

    // Claim verification — answers never exposed via API to non-reporters
    verificationQuestions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true }, // stored hashed
        hint: { type: String }, // optional public hint
      },
    ],

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    radius: { type: Number, required: true },
    locationLabel: { type: String }, // general area only, e.g. "Near Campus Gate"

    handoffPoint: { type: String }, // suggested public meetup

    status: {
      type: String,
      enum: ["active", "claimed", "returned", "closed"],
      default: "active",
    },

    claimAttempts: [
      {
        claimant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        answers: [{ questionIndex: Number, answer: String }],
        passed: { type: Boolean },
        attemptedAt: { type: Date, default: Date.now },
      },
    ],

    verifiedClaimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isFlagged: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

lostFoundSchema.index({ location: "2dsphere" });
lostFoundSchema.index({ status: 1, reportType: 1 });
lostFoundSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("LostFound", lostFoundSchema);
