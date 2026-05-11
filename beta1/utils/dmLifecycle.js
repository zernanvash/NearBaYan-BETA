const Message = require("../models/Message");
const Transaction = require("../models/Transaction");

const ARCHIVE_DELAY_MS = 60 * 60 * 1000; // 1 hour after transaction completes

/**
 * Opens a new temporary DM channel for a transaction.
 * Called when both parties confirm the agreement.
 */
async function openTransactionDM(transactionId, requesterID, fulfillerID) {
  const existing = await Message.findOne({ transaction: transactionId });
  if (existing) return existing; // already open

  const dm = await Message.create({
    transaction: transactionId,
    participants: [requesterID, fulfillerID],
    messages: [],
    isActive: true,
    isArchived: false,
    lastActivity: new Date(),
  });

  return dm;
}

/**
 * Schedules archiving of a DM 1 hour after transaction completion.
 * Sets the TTL archiveAt field on the Message document.
 */
async function scheduleArchive(transactionId) {
  const archiveAt = new Date(Date.now() + ARCHIVE_DELAY_MS);

  await Message.findOneAndUpdate(
    { transaction: transactionId },
    { archiveAt, isActive: false }
  );

  return archiveAt;
}

/**
 * Immediately archives a DM (e.g. on dispute or cancellation).
 */
async function archiveDM(transactionId) {
  await Message.findOneAndUpdate(
    { transaction: transactionId },
    { isActive: false, isArchived: true, archivedAt: new Date() }
  );
}

/**
 * Adds a message to an active DM.
 * Returns null if the DM is archived or inactive.
 */
async function sendMessage(transactionId, senderId, text, attachments = []) {
  const dm = await Message.findOne({ transaction: transactionId });

  if (!dm || dm.isArchived) {
    return null;
  }

  const message = {
    sender: senderId,
    text,
    attachments,
    readBy: [senderId],
    sentAt: new Date(),
  };

  dm.messages.push(message);
  dm.lastActivity = new Date();
  await dm.save();

  return message;
}

/**
 * Marks all messages in a DM as read by a given user.
 */
async function markAsRead(transactionId, userId) {
  await Message.updateOne(
    { transaction: transactionId },
    {
      $addToSet: { "messages.$[].readBy": userId },
    }
  );
}

module.exports = {
  openTransactionDM,
  scheduleArchive,
  archiveDM,
  sendMessage,
  markAsRead,
};
