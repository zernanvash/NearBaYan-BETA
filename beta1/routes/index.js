/**
 * NearBaYan API Routes
 * Base URL: /api/v1
 */

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

const { authenticate, requireRole } = require("../middleware/auth");
const { moderationMiddleware } = require("../utils/privacyFilter");
const User = require("../models/User");
const Post = require("../models/Post");
const Item = require("../models/Item");
const LostFound = require("../models/LostFound");
const Transaction = require("../models/Transaction");
const Message = require("../models/Message");
const { Rating, Report } = require("../models/RatingReport");
const { recordRating } = require("../utils/trustEngine");
const { openTransactionDM, scheduleArchive, archiveDM, sendMessage, markAsRead } = require("../utils/dmLifecycle");
const {
  hashVerificationAnswers,
  verifyClaimAnswers,
  sanitizeLostFoundForPublic,
} = require("../utils/claimVerification");

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function signAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function publicUser(userDoc) {
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete user.passwordHash;
  user.id = user._id;
  return user;
}

function pick(source, keys) {
  return keys.reduce((out, key) => {
    if (source[key] !== undefined) out[key] = source[key];
    return out;
  }, {});
}

function parsePoint(body) {
  const lng = Number(body.lng ?? body.longitude ?? body.location?.coordinates?.[0]);
  const lat = Number(body.lat ?? body.latitude ?? body.location?.coordinates?.[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { type: "Point", coordinates: [lng, lat] };
}

function distanceQuery(req, fallbackRadius = 5000) {
  const lng = Number(req.query.lng);
  const lat = Number(req.query.lat);
  const radius = Number(req.query.radius || fallbackRadius);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return {
    $near: {
      $geometry: { type: "Point", coordinates: [lng, lat] },
      $maxDistance: Number.isFinite(radius) ? radius : fallbackRadius,
    },
  };
}

function owns(userId, ownerId) {
  return ownerId && ownerId.toString() === userId.toString();
}

function canManage(req, ownerId) {
  return owns(req.user._id, ownerId) || ["admin", "moderator"].includes(req.user.role);
}

async function ensureParticipant(transactionId, userId) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) return null;
  const isParticipant = [transaction.requester, transaction.fulfiller].some((id) => owns(userId, id));
  return isParticipant ? transaction : false;
}

// AUTH
router.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email, and password are required." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) return res.status(409).json({ success: false, message: "Email already registered." });

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : undefined,
      passwordHash: await bcrypt.hash(password, 10),
    });

    res.status(201).json({
      success: true,
      message: "Account created.",
      data: { token: signAccessToken(user._id.toString()), user: publicUser(user) },
    });
  })
);

router.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required." });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }
    if (!user.isActive || user.isBanned) {
      return res.status(403).json({ success: false, message: "Account not authorized." });
    }

    user.lastSeen = new Date();
    await user.save();
    res.json({
      success: true,
      message: "Login successful.",
      data: { token: signAccessToken(user._id.toString()), user: publicUser(user) },
    });
  })
);

router.post(
  "/auth/refresh",
  asyncHandler(async (req, res) => {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ success: false, message: "token is required." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user || !user.isActive || user.isBanned) {
      return res.status(401).json({ success: false, message: "Account not authorized." });
    }
    res.json({
      success: true,
      message: "Token refreshed.",
      data: { token: signAccessToken(user._id.toString()), user: publicUser(user) },
    });
  })
);

router.post("/auth/logout", authenticate, (req, res) => {
  res.json({ success: true, message: "Logged out. Discard token client-side.", data: null });
});
router.post("/auth/verify/email", authenticate, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $set: { "verification.email": true } }, { new: true }).select("-passwordHash");
  res.json({ success: true, data: { user: publicUser(user) } });
}));
router.post("/auth/verify/phone", authenticate, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $set: { "verification.phone": true } }, { new: true }).select("-passwordHash");
  res.json({ success: true, data: { user: publicUser(user) } });
}));

// USERS
router.get("/users/me", authenticate, (req, res) => res.json({ success: true, data: { user: publicUser(req.user) } }));
router.put("/users/me", authenticate, asyncHandler(async (req, res) => {
  const updates = pick(req.body, ["name", "phone", "avatar", "defaultRadius"]);
  if (req.body.location) updates.location = req.body.location;
  const point = parsePoint(req.body);
  if (point) updates.location = { ...point, label: req.body.locationLabel || req.body.location?.label };
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select("-passwordHash");
  res.json({ success: true, message: "Profile updated.", data: { user: publicUser(user) } });
}));
router.get("/users/:id", authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash -blockedUsers -savedSearches");
  if (!user) return res.status(404).json({ success: false, message: "User not found." });
  res.json({ success: true, data: { user: publicUser(user) } });
}));
router.get("/users/:id/ratings", authenticate, asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ ratee: req.params.id }).populate("rater", "name avatar trust").sort("-createdAt");
  res.json({ success: true, data: { ratings } });
}));
router.get("/users/:id/history", authenticate, asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({
    status: "completed",
    $or: [{ requester: req.params.id }, { fulfiller: req.params.id }],
  }).sort("-completedAt").limit(50);
  res.json({ success: true, data: { transactions } });
}));
router.post("/users/block/:id", authenticate, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: req.params.id } });
  res.json({ success: true, message: "User blocked." });
}));
router.delete("/users/block/:id", authenticate, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: req.params.id } });
  res.json({ success: true, message: "User unblocked." });
}));
router.put("/users/location", authenticate, asyncHandler(async (req, res) => {
  const point = parsePoint(req.body);
  if (!point) return res.status(400).json({ success: false, message: "lng and lat are required." });
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { location: { ...point, label: req.body.label || req.body.locationLabel } } },
    { new: true }
  ).select("-passwordHash");
  res.json({ success: true, data: { user: publicUser(user) } });
}));
router.get("/users/me/saved-alerts", authenticate, (req, res) => res.json({ success: true, data: { savedSearches: req.user.savedSearches } }));
router.post("/users/me/saved-alerts", authenticate, asyncHandler(async (req, res) => {
  const alert = pick(req.body, ["keyword", "category", "radius"]);
  const user = await User.findByIdAndUpdate(req.user._id, { $push: { savedSearches: alert } }, { new: true }).select("-passwordHash");
  res.status(201).json({ success: true, data: { savedSearches: user.savedSearches } });
}));
router.delete("/users/me/saved-alerts/:alertId", authenticate, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $pull: { savedSearches: { _id: req.params.alertId } } }, { new: true }).select("-passwordHash");
  res.json({ success: true, data: { savedSearches: user.savedSearches } });
}));

// POSTS
router.get("/posts", authenticate, asyncHandler(async (req, res) => {
  const query = { isHidden: false };
  if (req.query.type) query.type = req.query.type;
  if (req.query.status) query.status = req.query.status;
  const nearby = distanceQuery(req, req.user.defaultRadius);
  if (nearby) query.location = nearby;
  const posts = await Post.find(query).populate("author", "name avatar trust").sort("-createdAt").limit(100);
  res.json({ success: true, data: { posts } });
}));
router.post("/posts", authenticate, moderationMiddleware, asyncHandler(async (req, res) => {
  const point = parsePoint(req.body);
  if (!point) return res.status(400).json({ success: false, message: "lng and lat are required." });
  const post = await Post.create({
    ...pick(req.body, ["type", "title", "description", "category", "payment", "deadline", "proofRequired", "images", "radius", "locationLabel", "expiresAt"]),
    author: req.user._id,
    location: point,
    radius: req.body.radius || req.user.defaultRadius || 1000,
  });
  res.status(201).json({ success: true, data: { post } });
}));
router.get("/posts/:id", authenticate, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate("author applicants.user answers.author", "name avatar trust");
  if (!post || post.isHidden) return res.status(404).json({ success: false, message: "Post not found." });
  res.json({ success: true, data: { post } });
}));
router.put("/posts/:id", authenticate, moderationMiddleware, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: "Post not found." });
  if (!canManage(req, post.author)) return res.status(403).json({ success: false, message: "Not allowed." });
  const updates = pick(req.body, ["title", "description", "category", "payment", "deadline", "proofRequired", "images", "radius", "locationLabel", "status", "expiresAt"]);
  const point = parsePoint(req.body);
  if (point) updates.location = point;
  Object.assign(post, updates);
  await post.save();
  res.json({ success: true, data: { post } });
}));
router.delete("/posts/:id", authenticate, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: "Post not found." });
  if (!canManage(req, post.author)) return res.status(403).json({ success: false, message: "Not allowed." });
  await post.deleteOne();
  res.json({ success: true, message: "Post deleted." });
}));
router.post("/posts/:id/apply", authenticate, asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { applicants: { user: req.user._id, proposal: req.body.proposal } } },
    { new: true }
  );
  if (!post) return res.status(404).json({ success: false, message: "Post not found." });
  res.json({ success: true, data: { post } });
}));
router.post("/posts/:id/accept/:uid", authenticate, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: "Post not found." });
  if (!owns(req.user._id, post.author)) return res.status(403).json({ success: false, message: "Only the author can accept applicants." });
  post.acceptedApplicant = req.params.uid;
  post.status = "accepted";
  await post.save();
  const transaction = await Transaction.create({
    type: post.type === "question" ? "errand" : post.type,
    postRef: post._id,
    requester: post.author,
    fulfiller: req.params.uid,
    agreement: {
      description: post.title,
      fee: post.payment?.amount || 0,
      currency: post.payment?.currency || "PHP",
      deadline: post.deadline,
      proofRequired: post.proofRequired?.description,
    },
  });
  await openTransactionDM(transaction._id, post.author, req.params.uid);
  res.json({ success: true, data: { post, transaction } });
}));
router.post("/posts/:id/cancel", authenticate, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: "Post not found." });
  if (!canManage(req, post.author)) return res.status(403).json({ success: false, message: "Not allowed." });
  post.status = "cancelled";
  await post.save();
  res.json({ success: true, data: { post } });
}));
router.post("/posts/:id/complete", authenticate, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: "Post not found." });
  if (!canManage(req, post.author)) return res.status(403).json({ success: false, message: "Not allowed." });
  post.status = "completed";
  await post.save();
  res.json({ success: true, data: { post } });
}));
router.post("/posts/:id/answers", authenticate, moderationMiddleware, asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $push: { answers: { author: req.user._id, text: req.body.text, label: req.body.label } } },
    { new: true }
  );
  if (!post) return res.status(404).json({ success: false, message: "Post not found." });
  res.status(201).json({ success: true, data: { post } });
}));
router.put("/posts/:id/answers/:aid", authenticate, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: "Post not found." });
  if (!canManage(req, post.author)) return res.status(403).json({ success: false, message: "Not allowed." });
  const answer = post.answers.id(req.params.aid);
  if (!answer) return res.status(404).json({ success: false, message: "Answer not found." });
  answer.label = req.body.label;
  await post.save();
  res.json({ success: true, data: { post } });
}));

// ITEMS
router.get("/items", authenticate, asyncHandler(async (req, res) => {
  const query = { isHidden: false };
  if (req.query.category) query.category = req.query.category;
  if (req.query.status) query.status = req.query.status;
  if (req.query.type) query[`availabilityType.${req.query.type}`] = true;
  const nearby = distanceQuery(req, req.user.defaultRadius);
  if (nearby) query.location = nearby;
  const items = await Item.find(query).populate("owner", "name avatar trust").sort("-createdAt").limit(100);
  res.json({ success: true, data: { items } });
}));
router.post("/items", authenticate, moderationMiddleware, asyncHandler(async (req, res) => {
  const point = parsePoint(req.body);
  if (!point) return res.status(400).json({ success: false, message: "lng and lat are required." });
  const item = await Item.create({
    ...pick(req.body, ["name", "description", "category", "images", "condition", "availabilityType", "pricing", "returnDeadline", "radius", "locationLabel"]),
    owner: req.user._id,
    location: point,
    radius: req.body.radius || req.user.defaultRadius || 1000,
  });
  res.status(201).json({ success: true, data: { item } });
}));
router.get("/items/:id", authenticate, asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id).populate("owner currentBorrower", "name avatar trust");
  if (!item || item.isHidden) return res.status(404).json({ success: false, message: "Item not found." });
  res.json({ success: true, data: { item } });
}));
router.put("/items/:id", authenticate, moderationMiddleware, asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Item not found." });
  if (!canManage(req, item.owner)) return res.status(403).json({ success: false, message: "Not allowed." });
  const updates = pick(req.body, ["name", "description", "category", "images", "condition", "availabilityType", "pricing", "returnDeadline", "radius", "locationLabel", "status"]);
  const point = parsePoint(req.body);
  if (point) updates.location = point;
  Object.assign(item, updates);
  await item.save();
  res.json({ success: true, data: { item } });
}));
router.delete("/items/:id", authenticate, asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Item not found." });
  if (!canManage(req, item.owner)) return res.status(403).json({ success: false, message: "Not allowed." });
  await item.deleteOne();
  res.json({ success: true, message: "Item deleted." });
}));
router.post("/items/:id/request", authenticate, asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Item not found." });
  if (owns(req.user._id, item.owner)) return res.status(400).json({ success: false, message: "You already own this item." });
  const type = req.body.type || (item.availabilityType.rent ? "rent" : item.availabilityType.borrow ? "borrow" : item.availabilityType.buy ? "buy" : "swap");
  const transaction = await Transaction.create({
    type,
    itemRef: item._id,
    requester: req.user._id,
    fulfiller: item.owner,
    agreement: {
      description: req.body.description || `Request for ${item.name}`,
      fee: req.body.fee ?? item.pricing?.rentFee ?? item.pricing?.buyPrice ?? 0,
      deposit: req.body.deposit ?? item.pricing?.deposit ?? 0,
      currency: item.pricing?.currency || "PHP",
      notes: req.body.notes,
    },
  });
  await openTransactionDM(transaction._id, req.user._id, item.owner);
  item.status = type === "buy" ? "reserved" : "reserved";
  item.currentBorrower = req.user._id;
  await item.save();
  res.status(201).json({ success: true, data: { transaction, item } });
}));
router.post("/items/:id/confirm-return", authenticate, asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Item not found." });
  if (!canManage(req, item.owner) && !owns(req.user._id, item.currentBorrower)) return res.status(403).json({ success: false, message: "Not allowed." });
  item.status = "available";
  item.currentBorrower = null;
  item.conditionPhotoOnReturn = req.body.conditionPhotoOnReturn || item.conditionPhotoOnReturn;
  await item.save();
  res.json({ success: true, data: { item } });
}));
router.post("/items/:id/condition-photo", authenticate, asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Item not found." });
  if (!canManage(req, item.owner)) return res.status(403).json({ success: false, message: "Not allowed." });
  item.conditionPhotoOnLend = req.body.url || req.body.conditionPhotoOnLend;
  await item.save();
  res.json({ success: true, data: { item } });
}));

// LOST & FOUND
router.get("/lost-found", authenticate, asyncHandler(async (req, res) => {
  const query = { isHidden: false };
  if (req.query.type) query.reportType = req.query.type;
  if (req.query.status) query.status = req.query.status;
  const nearby = distanceQuery(req, req.user.defaultRadius);
  if (nearby) query.location = nearby;
  const reports = await LostFound.find(query).populate("reporter", "name avatar trust").sort("-createdAt").limit(100);
  res.json({ success: true, data: { reports: reports.map(sanitizeLostFoundForPublic) } });
}));
router.post("/lost-found", authenticate, moderationMiddleware, asyncHandler(async (req, res) => {
  const point = parsePoint(req.body);
  if (!point) return res.status(400).json({ success: false, message: "lng and lat are required." });
  const verificationQuestions = req.body.verificationQuestions
    ? await hashVerificationAnswers(req.body.verificationQuestions)
    : [];
  const report = await LostFound.create({
    ...pick(req.body, ["reportType", "category", "title", "publicDescription", "privateDescription", "images", "radius", "locationLabel", "handoffPoint", "expiresAt"]),
    reporter: req.user._id,
    verificationQuestions,
    location: point,
    radius: req.body.radius || req.user.defaultRadius || 1000,
  });
  res.status(201).json({ success: true, data: { report: sanitizeLostFoundForPublic(report) } });
}));
router.get("/lost-found/:id", authenticate, asyncHandler(async (req, res) => {
  const report = await LostFound.findById(req.params.id).populate("reporter", "name avatar trust");
  if (!report || report.isHidden) return res.status(404).json({ success: false, message: "Report not found." });
  res.json({ success: true, data: { report: sanitizeLostFoundForPublic(report) } });
}));
router.get("/lost-found/:id/private", authenticate, asyncHandler(async (req, res) => {
  const report = await LostFound.findById(req.params.id).populate("reporter verifiedClaimant", "name avatar trust");
  if (!report) return res.status(404).json({ success: false, message: "Report not found." });
  if (!canManage(req, report.reporter) && !owns(req.user._id, report.verifiedClaimant)) return res.status(403).json({ success: false, message: "Not allowed." });
  res.json({ success: true, data: { report } });
}));
router.put("/lost-found/:id", authenticate, moderationMiddleware, asyncHandler(async (req, res) => {
  const report = await LostFound.findById(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: "Report not found." });
  if (!canManage(req, report.reporter)) return res.status(403).json({ success: false, message: "Not allowed." });
  const updates = pick(req.body, ["reportType", "category", "title", "publicDescription", "privateDescription", "images", "radius", "locationLabel", "handoffPoint", "status", "expiresAt"]);
  const point = parsePoint(req.body);
  if (point) updates.location = point;
  if (req.body.verificationQuestions) updates.verificationQuestions = await hashVerificationAnswers(req.body.verificationQuestions);
  Object.assign(report, updates);
  await report.save();
  res.json({ success: true, data: { report: sanitizeLostFoundForPublic(report) } });
}));
router.delete("/lost-found/:id", authenticate, asyncHandler(async (req, res) => {
  const report = await LostFound.findById(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: "Report not found." });
  if (!canManage(req, report.reporter)) return res.status(403).json({ success: false, message: "Not allowed." });
  report.status = "closed";
  await report.save();
  res.json({ success: true, data: { report: sanitizeLostFoundForPublic(report) } });
}));
router.post("/lost-found/:id/claim", authenticate, asyncHandler(async (req, res) => {
  const result = await verifyClaimAnswers(req.params.id, req.user._id, req.body.answers || []);
  res.status(result.passed ? 200 : 400).json({ success: result.passed, data: result, message: result.reason });
}));
router.post("/lost-found/:id/handoff", authenticate, asyncHandler(async (req, res) => {
  const report = await LostFound.findById(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: "Report not found." });
  if (!canManage(req, report.reporter) && !owns(req.user._id, report.verifiedClaimant)) return res.status(403).json({ success: false, message: "Not allowed." });
  report.status = "returned";
  await report.save();
  res.json({ success: true, data: { report: sanitizeLostFoundForPublic(report) } });
}));

// TRANSACTIONS
router.get("/transactions", authenticate, asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({
    $or: [{ requester: req.user._id }, { fulfiller: req.user._id }],
  }).populate("requester fulfiller", "name avatar trust").sort("-createdAt").limit(100);
  res.json({ success: true, data: { transactions } });
}));
router.get("/transactions/:id", authenticate, asyncHandler(async (req, res) => {
  const transaction = await ensureParticipant(req.params.id, req.user._id);
  if (transaction === null) return res.status(404).json({ success: false, message: "Transaction not found." });
  if (transaction === false) return res.status(403).json({ success: false, message: "Not allowed." });
  await transaction.populate("requester fulfiller postRef itemRef lostFoundRef");
  res.json({ success: true, data: { transaction } });
}));
router.post("/transactions", authenticate, asyncHandler(async (req, res) => {
  const transaction = await Transaction.create({
    ...pick(req.body, ["type", "postRef", "itemRef", "lostFoundRef", "fulfiller", "agreement"]),
    requester: req.user._id,
  });
  await openTransactionDM(transaction._id, req.user._id, transaction.fulfiller);
  res.status(201).json({ success: true, data: { transaction } });
}));
router.put("/transactions/:id/confirm", authenticate, asyncHandler(async (req, res) => {
  const transaction = await ensureParticipant(req.params.id, req.user._id);
  if (!transaction) return res.status(transaction === null ? 404 : 403).json({ success: false, message: transaction === null ? "Transaction not found." : "Not allowed." });
  if (owns(req.user._id, transaction.requester)) transaction.confirmedByRequester = true;
  if (owns(req.user._id, transaction.fulfiller)) transaction.confirmedByFulfiller = true;
  if (transaction.confirmedByRequester && transaction.confirmedByFulfiller) {
    transaction.status = "agreed";
    transaction.agreedAt = new Date();
  }
  await transaction.save();
  res.json({ success: true, data: { transaction } });
}));
router.post("/transactions/:id/proof", authenticate, asyncHandler(async (req, res) => {
  const transaction = await ensureParticipant(req.params.id, req.user._id);
  if (!transaction) return res.status(transaction === null ? 404 : 403).json({ success: false, message: transaction === null ? "Transaction not found." : "Not allowed." });
  transaction.proof = { ...transaction.proof, images: req.body.images || [], note: req.body.note, submittedAt: new Date() };
  transaction.status = "proof_submitted";
  await transaction.save();
  res.json({ success: true, data: { transaction } });
}));
router.post("/transactions/:id/verify-code", authenticate, asyncHandler(async (req, res) => {
  const transaction = await ensureParticipant(req.params.id, req.user._id);
  if (!transaction) return res.status(transaction === null ? 404 : 403).json({ success: false, message: transaction === null ? "Transaction not found." : "Not allowed." });
  transaction.proof.confirmedAt = new Date();
  transaction.status = "completed";
  transaction.completedAt = new Date();
  await transaction.save();
  await scheduleArchive(transaction._id);
  res.json({ success: true, data: { transaction } });
}));
router.post("/transactions/:id/complete", authenticate, asyncHandler(async (req, res) => {
  const transaction = await ensureParticipant(req.params.id, req.user._id);
  if (!transaction) return res.status(transaction === null ? 404 : 403).json({ success: false, message: transaction === null ? "Transaction not found." : "Not allowed." });
  transaction.status = "completed";
  transaction.completedAt = new Date();
  await transaction.save();
  await scheduleArchive(transaction._id);
  res.json({ success: true, data: { transaction } });
}));
router.post("/transactions/:id/dispute", authenticate, asyncHandler(async (req, res) => {
  const transaction = await ensureParticipant(req.params.id, req.user._id);
  if (!transaction) return res.status(transaction === null ? 404 : 403).json({ success: false, message: transaction === null ? "Transaction not found." : "Not allowed." });
  transaction.status = "disputed";
  transaction.dispute = { raisedBy: req.user._id, reason: req.body.reason, status: "open", raisedAt: new Date() };
  await transaction.save();
  await archiveDM(transaction._id);
  res.json({ success: true, data: { transaction } });
}));
router.post("/transactions/:id/cancel", authenticate, asyncHandler(async (req, res) => {
  const transaction = await ensureParticipant(req.params.id, req.user._id);
  if (!transaction) return res.status(transaction === null ? 404 : 403).json({ success: false, message: transaction === null ? "Transaction not found." : "Not allowed." });
  transaction.status = "cancelled";
  transaction.cancelledAt = new Date();
  transaction.cancelledBy = req.user._id;
  transaction.cancelReason = req.body.reason;
  await transaction.save();
  await archiveDM(transaction._id);
  res.json({ success: true, data: { transaction } });
}));

// MESSAGES
router.get("/messages/:transactionId", authenticate, asyncHandler(async (req, res) => {
  const transaction = await ensureParticipant(req.params.transactionId, req.user._id);
  if (!transaction) return res.status(transaction === null ? 404 : 403).json({ success: false, message: transaction === null ? "Transaction not found." : "Not allowed." });
  const thread = await Message.findOne({ transaction: req.params.transactionId }).populate("participants", "name avatar");
  res.json({ success: true, data: { thread } });
}));
router.post("/messages/:transactionId", authenticate, asyncHandler(async (req, res) => {
  const transaction = await ensureParticipant(req.params.transactionId, req.user._id);
  if (!transaction) return res.status(transaction === null ? 404 : 403).json({ success: false, message: transaction === null ? "Transaction not found." : "Not allowed." });
  const message = await sendMessage(req.params.transactionId, req.user._id, req.body.text, req.body.attachments || []);
  res.status(201).json({ success: Boolean(message), data: { message } });
}));
router.put("/messages/:transactionId/read", authenticate, asyncHandler(async (req, res) => {
  const transaction = await ensureParticipant(req.params.transactionId, req.user._id);
  if (!transaction) return res.status(transaction === null ? 404 : 403).json({ success: false, message: transaction === null ? "Transaction not found." : "Not allowed." });
  await markAsRead(req.params.transactionId, req.user._id);
  res.json({ success: true });
}));

// RATINGS / REPORTS / MODERATION
router.post("/ratings", authenticate, asyncHandler(async (req, res) => {
  const rating = await Rating.create({
    ...pick(req.body, ["transaction", "ratee", "score", "review", "tags"]),
    rater: req.user._id,
  });
  await recordRating(req.body.ratee, req.body.score);
  res.status(201).json({ success: true, data: { rating } });
}));
router.get("/ratings/:userId", authenticate, asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ ratee: req.params.userId }).populate("rater", "name avatar").sort("-createdAt");
  res.json({ success: true, data: { ratings } });
}));
router.post("/reports", authenticate, asyncHandler(async (req, res) => {
  const report = await Report.create({ ...req.body, reporter: req.user._id });
  res.status(201).json({ success: true, data: { report } });
}));
router.post("/reports/:id/appeal", authenticate, asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.id, { $set: { status: "under_review", reviewNote: req.body.reason } }, { new: true });
  if (!report) return res.status(404).json({ success: false, message: "Report not found." });
  res.json({ success: true, data: { report } });
}));
router.get("/moderation/queue", authenticate, requireRole("moderator", "admin"), asyncHandler(async (req, res) => {
  const reports = await Report.find({ status: { $in: ["pending", "under_review"] } }).sort("createdAt").limit(100);
  res.json({ success: true, data: { reports } });
}));
router.put("/moderation/:id/review", authenticate, requireRole("moderator", "admin"), asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.id, {
    $set: { status: "under_review", reviewedBy: req.user._id, reviewNote: req.body.reviewNote, reviewedAt: new Date() },
  }, { new: true });
  if (!report) return res.status(404).json({ success: false, message: "Report not found." });
  res.json({ success: true, data: { report } });
}));
router.put("/moderation/:id/approve", authenticate, requireRole("moderator", "admin"), asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.id, {
    $set: { status: "actioned", reviewedBy: req.user._id, reviewNote: req.body.reviewNote, reviewedAt: new Date() },
  }, { new: true });
  if (!report) return res.status(404).json({ success: false, message: "Report not found." });
  res.json({ success: true, data: { report } });
}));
router.put("/moderation/:id/reject", authenticate, requireRole("moderator", "admin"), asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.id, {
    $set: { status: "dismissed", reviewedBy: req.user._id, reviewNote: req.body.reviewNote, reviewedAt: new Date() },
  }, { new: true });
  if (!report) return res.status(404).json({ success: false, message: "Report not found." });
  res.json({ success: true, data: { report } });
}));
router.get("/moderation/appeals", authenticate, requireRole("moderator", "admin"), asyncHandler(async (req, res) => {
  const reports = await Report.find({ status: "under_review" }).sort("updatedAt").limit(100);
  res.json({ success: true, data: { reports } });
}));
router.put("/moderation/appeals/:id", authenticate, requireRole("moderator", "admin"), asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.id, {
    $set: { status: req.body.status || "dismissed", reviewedBy: req.user._id, reviewNote: req.body.reviewNote, reviewedAt: new Date() },
  }, { new: true });
  if (!report) return res.status(404).json({ success: false, message: "Report not found." });
  res.json({ success: true, data: { report } });
}));

module.exports = router;
