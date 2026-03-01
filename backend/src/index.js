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
import setupChatSocket  from "./socket/chatSocket.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();
const app=express();
const server = http.createServer(app);

// create socket server
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: true },
});
setupChatSocket(io);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.set("io", io);
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/",userapi);
app.use("/",login);
app.use("/",post);
app.use("/", checkauth);
app.use("/", logout);
app.use("/", postcomment);
app.use("/", profile);
app.use("/api", messageRoutes);
mongoose.connect("mongodb://127.0.0.1:27017/BuzzTweet")
.then(()=> console.log("mongoose Connected"))
.catch((err) => console.log(err));

server.listen(5000, () => console.log("Running On Port 5000"));
