/**
 * NearBaYan API Routes
 * All routes defined and stubbed. Implement controllers one module at a time.
 *
 * Base URL: /api/v1
 */

const express = require("express");
const router = express.Router();

const { authenticate, requireRole } = require("../middleware/auth");
const { moderationMiddleware } = require("../utils/privacyFilter");

// ─── Placeholder controller stubs ─────────────────────────────────────────────
// Replace each with actual implementation as you build out

const stub =
  (name) =>
  (req, res) =>
    res.json({ success: true, message: `[STUB] ${name}`, data: null });

// ─── AUTH ─────────────────────────────────────────────────────────────────────
// POST   /auth/register          Create account
// POST   /auth/login             Login, returns JWT
// POST   /auth/refresh           Refresh access token
// POST   /auth/logout            Invalidate token
// POST   /auth/verify/email      Confirm email verification code
// POST   /auth/verify/phone      Confirm phone OTP

router.post("/auth/register", stub("register"));
router.post("/auth/login", stub("login"));
router.post("/auth/refresh", stub("refresh"));
router.post("/auth/logout", authenticate, stub("logout"));
router.post("/auth/verify/email", authenticate, stub("verifyEmail"));
router.post("/auth/verify/phone", authenticate, stub("verifyPhone"));

// ─── USERS ────────────────────────────────────────────────────────────────────
// GET    /users/me               Get own profile
// PUT    /users/me               Update own profile
// GET    /users/:id              Get public profile of a user
// GET    /users/:id/ratings      Get ratings/reviews for a user
// GET    /users/:id/history      Get completed transaction history
// POST   /users/block/:id        Block a user
// DELETE /users/block/:id        Unblock a user
// PUT    /users/location         Update current location
// GET    /users/me/saved-alerts  Get saved searches/alerts
// POST   /users/me/saved-alerts  Add a saved alert
// DELETE /users/me/saved-alerts/:alertId  Remove a saved alert

router.get("/users/me", authenticate, stub("getMe"));
router.put("/users/me", authenticate, stub("updateMe"));
router.get("/users/:id", authenticate, stub("getUserProfile"));
router.get("/users/:id/ratings", authenticate, stub("getUserRatings"));
router.get("/users/:id/history", authenticate, stub("getUserHistory"));
router.post("/users/block/:id", authenticate, stub("blockUser"));
router.delete("/users/block/:id", authenticate, stub("unblockUser"));
router.put("/users/location", authenticate, stub("updateLocation"));
router.get("/users/me/saved-alerts", authenticate, stub("getSavedAlerts"));
router.post("/users/me/saved-alerts", authenticate, stub("addSavedAlert"));
router.delete("/users/me/saved-alerts/:alertId", authenticate, stub("removeSavedAlert"));

// ─── POSTS (Favors, Errands, Questions) ───────────────────────────────────────
// GET    /posts                  Get nearby posts (requires ?lat&lng&radius)
// POST   /posts                  Create a new post
// GET    /posts/:id              Get post detail
// PUT    /posts/:id              Update own post
// DELETE /posts/:id              Delete own post
// POST   /posts/:id/apply        Apply to fulfill a post
// POST   /posts/:id/accept/:uid  Accept an applicant
// POST   /posts/:id/cancel       Cancel a post
// POST   /posts/:id/complete     Mark post as completed
// POST   /posts/:id/answers      Add answer to a question post
// PUT    /posts/:id/answers/:aid Label an answer (Confirmed, Outdated, etc.)

router.get("/posts", authenticate, stub("getNearbyPosts"));
router.post("/posts", authenticate, moderationMiddleware, stub("createPost"));
router.get("/posts/:id", authenticate, stub("getPost"));
router.put("/posts/:id", authenticate, moderationMiddleware, stub("updatePost"));
router.delete("/posts/:id", authenticate, stub("deletePost"));
router.post("/posts/:id/apply", authenticate, stub("applyToPost"));
router.post("/posts/:id/accept/:uid", authenticate, stub("acceptApplicant"));
router.post("/posts/:id/cancel", authenticate, stub("cancelPost"));
router.post("/posts/:id/complete", authenticate, stub("completePost"));
router.post("/posts/:id/answers", authenticate, moderationMiddleware, stub("addAnswer"));
router.put("/posts/:id/answers/:aid", authenticate, stub("labelAnswer"));

// ─── ITEMS (Marketplace) ──────────────────────────────────────────────────────
// GET    /items                  Get nearby items (?lat&lng&radius&type&category)
// POST   /items                  Create a listing
// GET    /items/:id              Get item detail
// PUT    /items/:id              Update own listing
// DELETE /items/:id              Remove listing
// POST   /items/:id/request      Request to borrow/rent/buy/swap
// POST   /items/:id/confirm-return  Confirm item was returned
// POST   /items/:id/condition-photo Upload condition photo

router.get("/items", authenticate, stub("getNearbyItems"));
router.post("/items", authenticate, moderationMiddleware, stub("createItem"));
router.get("/items/:id", authenticate, stub("getItem"));
router.put("/items/:id", authenticate, moderationMiddleware, stub("updateItem"));
router.delete("/items/:id", authenticate, stub("deleteItem"));
router.post("/items/:id/request", authenticate, stub("requestItem"));
router.post("/items/:id/confirm-return", authenticate, stub("confirmReturn"));
router.post("/items/:id/condition-photo", authenticate, stub("uploadConditionPhoto"));

// ─── LOST & FOUND ─────────────────────────────────────────────────────────────
// GET    /lost-found             Get nearby reports (?lat&lng&radius&type)
// POST   /lost-found             Create a report
// GET    /lost-found/:id         Get report (public-safe version)
// GET    /lost-found/:id/private Get full report (reporter only)
// PUT    /lost-found/:id         Update own report
// DELETE /lost-found/:id         Close/remove report
// POST   /lost-found/:id/claim   Submit claim answers
// POST   /lost-found/:id/handoff Confirm handoff completed

router.get("/lost-found", authenticate, stub("getNearbyReports"));
router.post("/lost-found", authenticate, moderationMiddleware, stub("createReport"));
router.get("/lost-found/:id", authenticate, stub("getReport"));
router.get("/lost-found/:id/private", authenticate, stub("getPrivateReport"));
router.put("/lost-found/:id", authenticate, moderationMiddleware, stub("updateReport"));
router.delete("/lost-found/:id", authenticate, stub("closeReport"));
router.post("/lost-found/:id/claim", authenticate, stub("submitClaim"));
router.post("/lost-found/:id/handoff", authenticate, stub("confirmHandoff"));

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
// GET    /transactions           Get own transactions
// GET    /transactions/:id       Get transaction detail
// POST   /transactions           Create a transaction agreement
// PUT    /transactions/:id/confirm  Confirm agreement (requester or fulfiller)
// POST   /transactions/:id/proof Submit proof of completion
// POST   /transactions/:id/verify-code  Verify QR/one-time code
// POST   /transactions/:id/complete  Mark as completed
// POST   /transactions/:id/dispute  Raise a dispute
// POST   /transactions/:id/cancel   Cancel transaction

router.get("/transactions", authenticate, stub("getTransactions"));
router.get("/transactions/:id", authenticate, stub("getTransaction"));
router.post("/transactions", authenticate, stub("createTransaction"));
router.put("/transactions/:id/confirm", authenticate, stub("confirmTransaction"));
router.post("/transactions/:id/proof", authenticate, stub("submitProof"));
router.post("/transactions/:id/verify-code", authenticate, stub("verifyCode"));
router.post("/transactions/:id/complete", authenticate, stub("completeTransaction"));
router.post("/transactions/:id/dispute", authenticate, stub("raiseDispute"));
router.post("/transactions/:id/cancel", authenticate, stub("cancelTransaction"));

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
// GET    /messages/:transactionId         Get DM for a transaction
// POST   /messages/:transactionId         Send a message
// PUT    /messages/:transactionId/read    Mark messages as read

router.get("/messages/:transactionId", authenticate, stub("getMessages"));
router.post("/messages/:transactionId", authenticate, stub("sendMessage"));
router.put("/messages/:transactionId/read", authenticate, stub("markRead"));

// ─── RATINGS ──────────────────────────────────────────────────────────────────
// POST   /ratings                Submit a rating after transaction completes
// GET    /ratings/:userId         Get ratings for a user

router.post("/ratings", authenticate, stub("submitRating"));
router.get("/ratings/:userId", authenticate, stub("getRatings"));

// ─── REPORTS ──────────────────────────────────────────────────────────────────
// POST   /reports                Submit a report
// POST   /reports/:id/appeal     Appeal a moderation action

router.post("/reports", authenticate, stub("submitReport"));
router.post("/reports/:id/appeal", authenticate, stub("submitAppeal"));

// ─── MODERATION (moderator/admin only) ────────────────────────────────────────
// GET    /moderation/queue        Get flagged content queue
// PUT    /moderation/:id/review   Review a flagged item
// PUT    /moderation/:id/approve  Approve flagged content
// PUT    /moderation/:id/reject   Reject flagged content
// GET    /moderation/appeals      Get pending appeals
// PUT    /moderation/appeals/:id  Resolve an appeal

router.get("/moderation/queue", authenticate, requireRole("moderator", "admin"), stub("getModerationQueue"));
router.put("/moderation/:id/review", authenticate, requireRole("moderator", "admin"), stub("reviewItem"));
router.put("/moderation/:id/approve", authenticate, requireRole("moderator", "admin"), stub("approveItem"));
router.put("/moderation/:id/reject", authenticate, requireRole("moderator", "admin"), stub("rejectItem"));
router.get("/moderation/appeals", authenticate, requireRole("moderator", "admin"), stub("getAppeals"));
router.put("/moderation/appeals/:id", authenticate, requireRole("moderator", "admin"), stub("resolveAppeal"));

module.exports = router;
