import cookie from "cookie";
import jwt from "jsonwebtoken";
import { InsertMessage } from "../controllers/messageController.js";
const setupChatSocket = (io) => {
  const hasmap = new Map();
  io.on("connection", (socket) => {
    const rawCookie = socket.handshake.headers.cookie;

    if (!rawCookie) {
      return next(new Error("No cookie found"));
    }

    const parsed = cookie.parse(rawCookie);
    const token = parsed.token;
    if (!token) {
      return next(new Error("No token found in cookie"));
    }
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);

      let user = decode;
      // console.log(decode)
      // console.log("Decoded user from token:", user.id);
      hasmap.set(user.id, socket.id);
      // next();
      console.log("User authenticated:", user.username);
      console.log("Client connected:", socket.id);

      socket.on("sendMessage", (msg) => {
        console.log("Received message:", msg);
          // console.log("Sender ID:", hasmap);

          const receiverSocketId = hasmap.get(msg.receiver);
        console.log("Receiver Socket ID:", receiverSocketId);
        msg.sender ={ _id:user.id,username:user.username};
        // msg.seen=true;
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("message", msg);
        }   
        console.log(msg)
        InsertMessage(msg); // Save message to database  
        // socket.emit("receiveMessage", msg); // sender update
      });

     
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        hasmap.delete(user.id);
      });
    } catch (error) {
      console.log(error);
    }
  });
};

export default setupChatSocket;
