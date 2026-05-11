require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const routes = require("./routes/index");
const { authenticate } = require("./middleware/auth");
const { sendMessage, markAsRead } = require("./utils/dmLifecycle");

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.length === 0) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error("Not allowed by CORS"));
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ["GET", "POST"] },
});

// Socket auth middleware — validates JWT before allowing socket connection
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required."));

  try {
    const jwt = require("jsonwebtoken");
    const User = require("./models/User");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = await User.findById(decoded.id).select("-passwordHash");
    next();
  } catch {
    next(new Error("Invalid token."));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();
  console.log(`Socket connected: ${userId}`);

  // Join a room scoped to a transaction DM
  socket.on("join_dm", (transactionId) => {
    socket.join(`dm:${transactionId}`);
  });

  // Send a message via socket
  socket.on("send_message", async ({ transactionId, text, attachments }) => {
    const message = await sendMessage(transactionId, userId, text, attachments);
    if (message) {
      io.to(`dm:${transactionId}`).emit("new_message", {
        transactionId,
        message,
      });
    } else {
      socket.emit("error", { message: "This conversation is no longer active." });
    }
  });

  // Mark messages as read
  socket.on("mark_read", async ({ transactionId }) => {
    await markAsRead(transactionId, userId);
    socket.to(`dm:${transactionId}`).emit("messages_read", {
      transactionId,
      readBy: userId,
    });
  });

  // Notify nearby users of a new post (call from route handler)
  socket.on("join_location", ({ lat, lng }) => {
    // Clients subscribe to a rough grid cell for nearby notifications
    const cell = `loc:${Math.round(lat * 10) / 10}:${Math.round(lng * 10) / 10}`;
    socket.join(cell);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${userId}`);
  });
});

// Export io so route handlers can emit events (e.g. new nearby post)
module.exports.io = io;

// ─── Express Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { success: false, message: "Too many requests. Please slow down." },
  })
);

// Stricter limit on auth routes
app.use(
  "/api/v1/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: "Too many auth attempts." },
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1", routes);

app.get("/health", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// ─── Database & Start ─────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected.");
    server.listen(process.env.PORT || 5000, () => {
      console.log(`NearBaYan server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
