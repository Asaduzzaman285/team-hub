// apps/api/src/index.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  // Allow the frontend's domain. In production set CLIENT_URL to your Vercel/frontend URL.
  origin: (origin, callback) => {
    const allowed = process.env.CLIENT_URL || "http://localhost:3000";
    // Allow requests with no origin (e.g. server-to-server, Postman) and the allowed frontend
    if (!origin || origin === allowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
}));
app.use(express.json());
app.use(cookieParser());

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track online users: socketId -> { userId, workspaceId, name, avatar }
const socketUsers = new Map();

const getOnlineUsers = (workspaceId) => {
  const users = Array.from(socketUsers.values())
    .filter(u => u.workspaceId === workspaceId);
  
  // Return unique users by ID
  const uniqueUsers = {};
  users.forEach(u => {
    uniqueUsers[u.userId] = { id: u.userId, name: u.name, avatar: u.avatar };
  });
  return Object.values(uniqueUsers);
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-workspace", ({ workspaceId, user }) => {
    socket.join(workspaceId);
    
    if (user) {
      socket.join(`user:${user.id}`); // Join personal room for notifications
      socketUsers.set(socket.id, {
        userId: user.id,
        workspaceId,
        name: user.name,
        avatar: user.avatar
      });
      
      // Notify everyone in the workspace about the presence update
      io.to(workspaceId).emit("presence-update", getOnlineUsers(workspaceId));
    }
    
    console.log(`User ${user?.name || socket.id} joined workspace ${workspaceId}`);
  });

  socket.on("disconnect", () => {
    const userData = socketUsers.get(socket.id);
    if (userData) {
      const { workspaceId } = userData;
      socketUsers.delete(socket.id);
      
      // Broadcast update to the workspace they left
      io.to(workspaceId).emit("presence-update", getOnlineUsers(workspaceId));
    }
    console.log("User disconnected:", socket.id);
  });
});

// Attach prisma and io to request
app.use((req, res, next) => {
  req.prisma = prisma;
  req.io = io;
  next();
});

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Team Hub API is running" });
});

// Routes
const authRoutes = require("./routes/auth");
const workspaceRoutes = require("./routes/workspaces");
const goalRoutes = require("./routes/goals");
const actionItemRoutes = require("./routes/action-items");
const announcementRoutes = require("./routes/announcements");

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/action-items", actionItemRoutes);
app.use("/api/announcements", announcementRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
