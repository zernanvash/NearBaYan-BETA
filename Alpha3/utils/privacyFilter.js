/**
 * Privacy filter middleware and utilities.
 * Strips or flags sensitive information before content is served publicly.
 */

// Patterns for common PH-context sensitive data
const SENSITIVE_PATTERNS = [
  // Phone numbers (PH formats)
  { pattern: /(\+63|0)(9\d{9}|\d{10})/g, label: "phone_number" },
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, label: "email" },
  // PH ID numbers (generic numeric blocks that look like IDs)
  { pattern: /\b\d{2}-\d{7}-\d\b/g, label: "sss_number" },
  { pattern: /\b\d{12}\b/g, label: "philsys_number" },
  // Street addresses with house/unit numbers
  { pattern: /\b(blk|block|lot|unit|#|no\.?)\s*\d+[,\s]/gi, label: "address" },
  // Birthdates (various formats)
  {
    pattern: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](\d{2}|\d{4})\b/g,
    label: "birthdate",
  },
  // Social media handles
  { pattern: /@[a-zA-Z0-9_.]{2,}/g, label: "social_handle" },
  // Facebook/messenger links
  { pattern: /m\.me\/[a-zA-Z0-9.]+/gi, label: "messenger_link" },
  { pattern: /facebook\.com\/[a-zA-Z0-9.]+/gi, label: "facebook_link" },
];

const SCAM_PATTERNS = [
  /gcash.*send.*first/i,
  /pay.*advance/i,
  /trust.*me.*money/i,
  /load.*first/i,
  /\bgcash number\b/i,
  /maya.*number/i,
];

/**
 * Redacts sensitive information from a text string.
 * Returns { cleaned: string, flagged: boolean, detectedTypes: string[] }
 */
function redactSensitiveText(text) {
  if (!text) return { cleaned: text, flagged: false, detectedTypes: [] };

  let cleaned = text;
  const detectedTypes = [];

  for (const { pattern, label } of SENSITIVE_PATTERNS) {
    if (pattern.test(cleaned)) {
      detectedTypes.push(label);
      cleaned = cleaned.replace(pattern, `[${label.replace("_", " ")} hidden]`);
    }
    pattern.lastIndex = 0; // reset global regex state
  }

  return {
    cleaned,
    flagged: detectedTypes.length > 0,
    detectedTypes,
  };
}

/**
 * Checks if text contains scam-like patterns.
 * Returns { isScam: boolean, matchedPatterns: string[] }
 */
function detectScamPatterns(text) {
  if (!text) return { isScam: false, matchedPatterns: [] };

  const matched = SCAM_PATTERNS.filter((p) => p.test(text)).map((p) =>
    p.toString()
  );

  return { isScam: matched.length > 0, matchedPatterns: matched };
}

/**
 * Runs full moderation check on a post before saving.
 * Returns { shouldFlag: boolean, shouldBlock: boolean, reasons: string[] }
 */
function moderateContent(fields = {}) {
  const reasons = [];
  let shouldBlock = false;

  const allText = Object.values(fields).filter(Boolean).join(" ");

  // Check for sensitive data leaks
  const { flagged, detectedTypes } = redactSensitiveText(allText);
  if (flagged) {
    reasons.push(`Contains sensitive info: ${detectedTypes.join(", ")}`);
  }

  // Check for scam patterns
  const { isScam, matchedPatterns } = detectScamPatterns(allText);
  if (isScam) {
    reasons.push("Scam-like payment language detected");
    shouldBlock = true;
  }

  // Blocked item keywords
  const blockedKeywords = [
    "shabu", "droga", "drugs", "vape", "alcohol", "belo", "prescription",
    "gamot", "gun", "baril", "kutsilyo", "knife", "weapon", "armas",
  ];
  const foundBlocked = blockedKeywords.filter((kw) =>
    allText.toLowerCase().includes(kw)
  );
  if (foundBlocked.length > 0) {
    reasons.push(`Blocked keyword(s): ${foundBlocked.join(", ")}`);
    shouldBlock = true;
  }

  return {
    shouldFlag: reasons.length > 0,
    shouldBlock,
    reasons,
  };
}

/**
 * Express middleware — runs moderation on req.body before route handler.
 * Attaches moderation result to req.moderation.
 */
function moderationMiddleware(req, res, next) {
  const result = moderateContent(req.body);

  if (result.shouldBlock) {
    return res.status(400).json({
      success: false,
      message: "Post contains content that violates community guidelines.",
      reasons: result.reasons,
    });
  }

  req.moderation = result; // attach for route handler to decide on flagging
  next();
}

module.exports = {
  redactSensitiveText,
  detectScamPatterns,
  moderateContent,
  moderationMiddleware,
};
