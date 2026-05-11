const bcrypt = require("bcrypt");
const LostFound = require("../models/LostFound");

const SALT_ROUNDS = 10;
const MAX_ATTEMPTS = 3; // per user per post

/**
 * Hashes verification answers before storing them.
 * @param {Array<{question: string, answer: string, hint?: string}>} questions
 */
async function hashVerificationAnswers(questions) {
  return Promise.all(
    questions.map(async (q) => ({
      question: q.question,
      answer: await bcrypt.hash(q.answer.trim().toLowerCase(), SALT_ROUNDS),
      hint: q.hint || null,
    }))
  );
}

/**
 * Verifies a claimant's answers against stored hashed answers.
 * Returns { passed: boolean, score: number, total: number }
 *
 * Requires passing ALL questions to prevent partial guessing.
 */
async function verifyClaimAnswers(lostFoundId, claimantId, submittedAnswers) {
  const report = await LostFound.findById(lostFoundId);

  if (!report || report.status !== "active") {
    return { passed: false, reason: "Report not available for claiming." };
  }

  // Check attempt count for this claimant
  const previousAttempts = report.claimAttempts.filter(
    (a) => a.claimant.toString() === claimantId.toString()
  );

  if (previousAttempts.length >= MAX_ATTEMPTS) {
    return {
      passed: false,
      reason: "Maximum claim attempts reached for this report.",
    };
  }

  const questions = report.verificationQuestions;

  if (submittedAnswers.length !== questions.length) {
    return { passed: false, reason: "Incomplete answers submitted." };
  }

  // Check each answer
  const results = await Promise.all(
    questions.map(async (q, i) => {
      const submitted = (submittedAnswers[i]?.answer || "").trim().toLowerCase();
      return bcrypt.compare(submitted, q.answer);
    })
  );

  const passed = results.every(Boolean);
  const score = results.filter(Boolean).length;

  // Record attempt
  await LostFound.findByIdAndUpdate(lostFoundId, {
    $push: {
      claimAttempts: {
        claimant: claimantId,
        answers: submittedAnswers.map((a, i) => ({
          questionIndex: i,
          answer: "[redacted]", // never store submitted answers
        })),
        passed,
        attemptedAt: new Date(),
      },
    },
  });

  // If passed, mark claimant as verified
  if (passed) {
    await LostFound.findByIdAndUpdate(lostFoundId, {
      verifiedClaimant: claimantId,
      status: "claimed",
    });
  }

  return { passed, score, total: questions.length };
}

/**
 * Returns the public-safe version of a lost & found report.
 * Strips private description, original images, and hashed answers.
 * Only exposes question text and optional hints.
 */
function sanitizeLostFoundForPublic(report) {
  const obj = report.toObject ? report.toObject() : { ...report };

  // Remove private fields
  delete obj.privateDescription;
  delete obj.images?.original;
  delete obj.claimAttempts;

  // Strip answers from verification questions — show only question + hint
  if (obj.verificationQuestions) {
    obj.verificationQuestions = obj.verificationQuestions.map((q) => ({
      question: q.question,
      hint: q.hint || null,
    }));
  }

  return obj;
}

module.exports = {
  hashVerificationAnswers,
  verifyClaimAnswers,
  sanitizeLostFoundForPublic,
};
