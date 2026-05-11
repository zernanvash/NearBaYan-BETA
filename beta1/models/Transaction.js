const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["favor", "errand", "borrow", "rent", "buy", "swap", "lost_found"],
      required: true,
    },

    // References — only one will be populated depending on type
    postRef: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    itemRef: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    lostFoundRef: { type: mongoose.Schema.Types.ObjectId, ref: "LostFound" },

    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fulfiller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The agreement summary both parties confirm
    agreement: {
      description: { type: String, required: true },
      fee: { type: Number, default: 0 },
      deposit: { type: Number, default: 0 },
      currency: { type: String, default: "PHP" },
      deadline: { type: Date },
      returnTime: { type: Date },
      proofRequired: { type: String },
      handoffPoint: { type: String },
      notes: { type: String },
    },

    confirmedByRequester: { type: Boolean, default: false },
    confirmedByFulfiller: { type: Boolean, default: false },
    agreedAt: { type: Date },

    status: {
      type: String,
      enum: [
        "pending_agreement",
        "agreed",
        "in_progress",
        "proof_submitted",
        "completed",
        "disputed",
        "cancelled",
      ],
      default: "pending_agreement",
    },

    proof: {
      images: [{ type: String }], // S3 URLs
      note: { type: String },
      qrCode: { type: String },   // one-time code
      submittedAt: { type: Date },
      confirmedAt: { type: Date },
    },

    // QR / one-time confirmation codes
    confirmationCode: { type: String },       // hashed
    returnCode: { type: String },             // hashed — for borrow/rent returns

    dispute: {
      raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String },
      status: {
        type: String,
        enum: ["open", "under_review", "resolved"],
      },
      resolution: { type: String },
      raisedAt: { type: Date },
      resolvedAt: { type: Date },
    },

    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

transactionSchema.index({ requester: 1, status: 1 });
transactionSchema.index({ fulfiller: 1, status: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
