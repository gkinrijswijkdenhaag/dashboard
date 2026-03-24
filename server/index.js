const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const http = require("http");
const socketIo = require("socket.io");
const rateLimit = require("express-rate-limit");
const config = require("./config/config");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// CORS Configuration
const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

// Middleware
app.use(helmet()); // Security headers (X-Frame-Options, CSP, X-Content-Type-Options, etc.)
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));

// Import database initialization
const { initializeDatabase } = require("./db/init");

// Routes
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const passcodeRoutes = require("./routes/passcode");
const adminRoutes = require("./routes/admin");
const assignmentsRoutes = require("./routes/assignments");
const workflowRoutes = require("./routes/workflow");
const emailRoutes = require("./routes/email");
const lyricsRoutes = require("./routes/lyrics");
const sermonRoutes = require("./routes/sermon");
const musicLinksRoutes = require("./routes/musicLinks");
const activityRoutes = require("./routes/activity");
const emailHistoryRoutes = require("./routes/emailHistory");
const emailSettingsRoutes = require("./routes/emailSettings");
const profileRoutes = require("./routes/profile");
const assignablePeopleRoutes = require("./routes/assignablePeople");
const roleEmailsRoutes = require("./routes/roleEmails");
const publicScheduleRoutes = require("./routes/publicSchedule");

// Use routes
app.use("/api/auth", authRoutes); // loginLimiter is applied inside the auth router
app.use("/api/chat", chatRoutes);
app.use("/api/passcodes", passcodeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/email-history", emailHistoryRoutes);
app.use("/api/email-settings", emailSettingsRoutes);
app.use("/api/lyrics", lyricsRoutes);
app.use("/api/sermon", sermonRoutes);
app.use("/api/music-links", musicLinksRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/assignable-people", assignablePeopleRoutes);
app.use("/api/role-emails", roleEmailsRoutes);
app.use("/api/public/schedule", publicScheduleRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("GKIN API is running");
});

// Store active user connections
const activeConnections = new Map();

// Export io instance for use in other files
module.exports.io = io;

/**
 * Emit an activity update to all connected clients
 * @param {Object} activity - The activity object to emit
 */
const emitActivityUpdate = (activity) => {
  try {
    // Broadcast to all connected clients
    io.emit("activity_update", activity);
    console.log("Activity update emitted via WebSocket");
  } catch (error) {
    console.error("Error emitting activity update:", error);
  }
};

// Export the emitActivityUpdate function for use in controllers
module.exports.emitActivityUpdate = emitActivityUpdate;

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle authentication
  const token = socket.handshake.auth.token;
  if (!token) {
    console.warn("Socket connection rejected: no token provided", socket.id);
    socket.disconnect(true);
    return;
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret);
    const userId = decoded.id;

    // Store user info in socket
    socket.userId = userId;
    socket.userRole = decoded.role;

    // Check for existing connections from this user
    if (activeConnections.has(userId)) {
      const existingSocket = io.sockets.sockets.get(
        activeConnections.get(userId)
      );
      if (existingSocket) {
        console.log(
          `User ${userId} already has an active connection. Disconnecting previous socket.`
        );
        existingSocket.disconnect();
      }
    }

    // Store this as the active connection for this user
    activeConnections.set(userId, socket.id);

    // Auto-join rooms for user ID and role
    socket.join(`user-${userId}`);
    socket.join(decoded.role);
    console.log(
      `Socket ${socket.id} auto-joined rooms: user-${userId}, ${decoded.role}`
    );
  } catch (error) {
    console.error("Socket authentication error:", error);
    socket.disconnect();
    return;
  }

  // Join a room (for private messaging if needed later)
  socket.on("join", (room) => {
    // Check if socket is already in the room to prevent duplicate joins
    const rooms = Array.from(socket.rooms.values());
    if (!rooms.includes(room)) {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    } else {
      console.log(`Socket ${socket.id} already in room: ${room}`);
    }
  });

  // Handle new messages
  socket.on("message", async (message) => {
    try {
      // We'll handle message saving in the API endpoint
      // Just broadcast the message to all clients
      io.emit("message", message);
    } catch (error) {
      console.error("Error handling socket message:", error);
    }
  });

  // Handle mentions
  socket.on("mention", (data) => {
    // Broadcast to specific roles or users
    if (data.type === "role") {
      io.to(data.value).emit("mention", data);
    } else {
      io.to(`user-${data.userId}`).emit("mention", data);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    // Remove from active connections if this was the active socket for the user
    if (socket.userId && activeConnections.get(socket.userId) === socket.id) {
      activeConnections.delete(socket.userId);
      console.log(`Removed user ${socket.userId} from active connections`);
    }
  });
});

// Initialize database before starting the server
initializeDatabase()
  .then(() => {
    // After database is initialized, inject the emitActivityUpdate function into controllers
    // to avoid circular dependency during initialization
    const workflowController = require("./controllers/workflowController");
    const musicLinksController = require("./controllers/musicLinksController");

    if (workflowController.setEmitActivityUpdate) {
      workflowController.setEmitActivityUpdate(emitActivityUpdate);
    }
    if (musicLinksController.setEmitActivityUpdate) {
      musicLinksController.setEmitActivityUpdate(emitActivityUpdate);
    }

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
