const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verifies JWT from Authorization header.
 * Attaches req.user on success.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided." });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user || !user.isActive || user.isBanned) {
      return res.status(401).json({ success: false, message: "Account not authorized." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

/**
 * Role guard factory.
 * Usage: requireRole("moderator") or requireRole("admin")
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions." });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
