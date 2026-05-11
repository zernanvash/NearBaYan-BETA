const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Each conversation is scoped to one transaction
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, maxlength: 1000 },
        attachments: [{ type: String }], // S3 URLs
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        sentAt: { type: Date, default: Date.now },
        isDeleted: { type: Boolean, default: false },
      },
    ],

    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },

    // Auto-archive 1 hour after transaction completes
    archiveAt: { type: Date },
    archivedAt: { type: Date },

    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

messageSchema.index({ transaction: 1 });
messageSchema.index({ participants: 1 });
messageSchema.index({ archiveAt: 1 }, { expireAfterSeconds: 0 }); // TTL

module.exports = mongoose.model("Message", messageSchema);
