import cookie from "cookie";
import jwt from "jsonwebtoken";

const setupChatSocket = (io) => {
  // userId -> socketId  (to route messages to the right socket)
  const hasmap = new Map();

    io.on("connection", (socket) => {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) return;

      const parsed = cookie.parse(rawCookie);
      const token = parsed.token;
      if (!token) return;

      try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const user = decode; // { id, username, … }

        // ── 1. Register this socket & broadcast online status ──
        hasmap.set(user.id, socket.id);

        // Tell every OTHER connected socket that this user is now online
        socket.broadcast.emit("userOnline", { userId: user.id });

        // Also send the full current online list to the user who just connected
        // so their UI is in sync immediately
        socket.emit("onlineUsers", Array.from(hasmap.keys()));

        // ── 2. Message relay ──
        socket.on("sendMessage", (msg) => {
          const receiverSocketId = hasmap.get(msg.receiver);
          msg.sender = { _id: user.id, username: user.username };
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("message", msg);
          }
        });

        // ── 3. Seen receipt relay ──
        socket.on("sendseen", (data) => {
          const receiverSocketId = hasmap.get(data.sender);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("seenreceipt", {
              sender: data.sender,
              receiver: data.receiver,
              timestamp: new Date().toISOString(),
            });
          }
        });

        // ── 4. Typing indicator relay ──
        // data = { receiver: userId }
        socket.on("typing", (data) => {
          const receiverSocketId = hasmap.get(data.receiver);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", { sender: user.id });
          }
        });

        socket.on("stopTyping", (data) => {
          const receiverSocketId = hasmap.get(data.receiver);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("stopTyping", { sender: user.id });
          }
        });

        // ── 5. Disconnect → broadcast offline ──
        socket.on("disconnect", () => {
          hasmap.delete(user.id);
          // Tell everyone this user went offline
          io.emit("userOffline", { userId: user.id });
        });

      } catch (error) {

      }
    });
};

function sum() {

}
export default setupChatSocket;
