import cookie from "cookie";
import jwt from "jsonwebtoken";
import { InsertMessage } from "../controllers/messageController.js";
const setupChatSocket = (io) => {
  const hasmap = new Map();
  io.on("connection", (socket) => {
    const rawCookie = socket.handshake.headers.cookie;
    if (!rawCookie) {
      return;
    }
    const parsed = cookie.parse(rawCookie);
    const token = parsed.token;
    if (!token) {
      return;
    }
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      let user = decode;
      hasmap.set(user.id, socket.id);
      

      socket.on("sendMessage", (msg) => {
        const receiverSocketId = hasmap.get(msg.receiver);
        console.log("Receiver Socket ID:", receiverSocketId);
        msg.sender ={ _id:user.id,username:user.username};
        // msg.seen=true;
        if (receiverSocketId) {
         io.to(receiverSocketId).emit("message", msg);
          // console.log(resuf)
        }   
        // console.log("CHATSOCKET",msg)
        // InsertMessage(msg); // Save message to database  
        // socket.emit("receiveMessage", msg); // sender update
      });
      socket.on("sendseen", (data) => {
        console.log("Received seen receipt from client:", data);
          const receiverSocketId = hasmap.get(data.sender);
          console.log("Receiver Socket ID for seen receipt:", receiverSocketId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("seenreceipt", {
              sender: data.sender,
              receiver: data.receiver,
              timestamp: new Date().toISOString(),
            });
            console.log("Sent seen receipt to sender:", data.sender);
          }
      });
      socket.on("disconnect", () => {
        // console.log("Client disconnected:", socket.id);
        hasmap.delete(user.id);
      });
    } catch (error) {
      console.log(error);
    }
  });
};

export default setupChatSocket;
