const User = require("../models/User");

/**
 * Recalculates and updates a user's trust score and label.
 * Call this after every completed/cancelled transaction or new rating.
 */
async function recalculateTrust(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const t = user.trust;

  // Weighted score formula
  // Completion rate, rating average, and penalties for cancellations/reports
  const completionWeight = Math.min(t.completedTransactions * 0.1, 2.0);
  const ratingWeight = t.totalRatings > 0 ? t.score : 0;
  const cancellationPenalty = Math.min(t.cancellations * 0.15, 1.0);
  const reportPenalty = Math.min(t.reportCount * 0.25, 1.5);

  const rawScore =
    completionWeight * 0.3 +
    ratingWeight * 0.5 -
    cancellationPenalty -
    reportPenalty;

  const finalScore = Math.max(0, Math.min(5, rawScore));

  // Determine label
  let label = "New User";
  if (user.verification.email || user.verification.phone) {
    label = "Verified User";
  }
  if (t.completedTransactions >= 5 && finalScore >= 3.5) {
    label = "Reliable Helper";
  }
  if (t.returnedItems >= 3 && finalScore >= 3.5) {
    label = "Good Borrower";
  }
  if (t.successfulHandoffs >= 5 && finalScore >= 4.0) {
    label = "Trusted Lender";
  }
  if (t.completedTransactions >= 15 && finalScore >= 4.2) {
    label = "Trusted Community Member";
  }

  await User.findByIdAndUpdate(userId, {
    "trust.score": parseFloat(finalScore.toFixed(2)),
    "trust.label": label,
  });

  return { score: finalScore, label };
}

/**
 * Updates trust counters after a transaction event.
 * @param {string} userId
 * @param {"completed"|"cancelled"|"returned"|"handoff"|"reported"} event
 */
async function recordTrustEvent(userId, event) {
  const update = {};

  switch (event) {
    case "completed":
      update.$inc = { "trust.completedTransactions": 1 };
      break;
    case "cancelled":
      update.$inc = { "trust.cancellations": 1 };
      break;
    case "returned":
      update.$inc = { "trust.returnedItems": 1 };
      break;
    case "handoff":
      update.$inc = { "trust.successfulHandoffs": 1 };
      break;
    case "reported":
      update.$inc = { "trust.reportCount": 1 };
      break;
    default:
      return;
  }

  await User.findByIdAndUpdate(userId, update);
  await recalculateTrust(userId);
}

/**
 * Updates trust score after a new rating is submitted.
 * @param {string} rateeId
 * @param {number} newScore  1–5
 */
async function recordRating(rateeId, newScore) {
  const user = await User.findById(rateeId);
  if (!user) return;

  const currentTotal = user.trust.score * user.trust.totalRatings;
  const newTotal = user.trust.totalRatings + 1;
  const newAverage = (currentTotal + newScore) / newTotal;

  await User.findByIdAndUpdate(rateeId, {
    "trust.score": parseFloat(newAverage.toFixed(2)),
    "trust.totalRatings": newTotal,
  });

  await recalculateTrust(rateeId);
}

module.exports = { recalculateTrust, recordTrustEvent, recordRating };
