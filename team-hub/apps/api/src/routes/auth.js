const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// Helper to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

// Cookie options
// In production, frontend & backend are on different domains (e.g. Vercel + Railway).
// sameSite must be "none" (with secure:true) to allow cross-domain cookies.
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await req.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await req.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await req.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      message: "Logged in successfully",
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Refresh Token
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await req.prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { accessToken } = generateTokens(user);

    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });

    res.json({ message: "Token refreshed" });
  } catch (error) {
    console.error("Refresh Error:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

const cloudinary = require("cloudinary").v2;

// Cloudinary Config (Assume env vars are set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ... (existing code)

// Update Profile
router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    let avatarUrl = avatar;

    if (avatar && avatar.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(avatar, {
        folder: "avatars",
      });
      avatarUrl = uploadRes.secure_url;
    }

    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: { name, avatar: avatarUrl },
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Notifications
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await req.prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark Notifications as Read
router.post("/notifications/read", authMiddleware, async (req, res) => {
  await req.prisma.notification.updateMany({
    where: { userId: req.user.id },
    data: { isRead: true },
  });
  res.json({ message: "Notifications marked as read" });
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

// Get Current User
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
