import express from "express";
import mongoose from "mongoose";
import userapi from "./routes/userapi.js";
import login from "./routes/login.js";
import post from "./routes/post.js";
import postcomment from "./routes/postcomment.js";
import checkauth from "./routes/check-auth.js";
import logout from "./routes/logout.js";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import profile from "./routes/profile.js";
import http from "http";
import { Server } from "socket.io";
import setupChatSocket from "./socket/chatSocket.js";
import messageRoutes from "./routes/messageRoutes.js";
import aiProxy from "./routes/aiProxy.js";
import path from "path";
import { fileURLToPath } from "url";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (one level up from src/)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === "production";

// Allowed origins for CORS
// const allowedOrigins = 
// process.env.FRONTEND_URL
//   ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
//   : ["http://localhost:5173"];

// Create socket server
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});
setupChatSocket(io);

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.set("io", io);
app.use(cookieParser());
app.use(express.json());

// Serve uploaded files — use absolute path so it works regardless of CWD
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Health check endpoint for deployment monitoring
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/", userapi);
app.use("/", login);
app.use("/", post);
app.use("/", checkauth);
app.use("/", logout);
app.use("/", postcomment);
app.use("/", profile);
app.use("/api", messageRoutes);
app.use("/api/ai", aiProxy);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/BuzzTweet")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server running on port ${port}`));
