import Message from "../models/Message.js";
import mongoose from "mongoose";
import MessageStatus from "../models/MessageStatus.js";
import User from "../models/User.js";
// export const sendMessage = (req, res) => {
//   const { message } = req.body;
//   // get socket instance
//   const io = req.app.get("io");
  
//   // emit message to all connected clients
//   io.emit("message", message);

//   res.json({ status: "Message sent" });
// };

export const getMessages = async (req, res) => {
  const id = req.user.id; 
  const currentUserId = new mongoose.Types.ObjectId(id); 

  try {
    const latestMessages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserId }, { receiver: currentUserId }],
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $addFields: {
          otherUser: {
            $cond: [
              { $eq: ["$sender", currentUserId] },
              "$receiver",
              "$sender",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$content" },
          lastTime: { $first: "$timestamp" },
        },
      },
      { $sort: { lastTime: -1 } }
    ]);

    const populatedMessages = await User.populate(latestMessages, { path: "_id", select: "username" });
    
    const chats = populatedMessages
      .filter(msg => msg._id) // filter out deleted users
      .map(msg => ({
        userId: msg._id._id,
        username: msg._id.username,
        lastMessage: msg.lastMessage,
        lastTime: msg.lastTime
      }));

    res.json({ messages: chats });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
}

export const getMessagesuser = async (req, res) => {
    const {reciverid}=req.body;
    const senderId = req.user.id;
    const receiverId = new mongoose.Types.ObjectId(reciverid);
    try { 
        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        }).populate("sender", "username").populate("receiver", "username").sort({ timestamp: 1 });
        // We need to know when the OTHER user (receiverId) last read OUR (senderId's) messages.
        // That record is: "receiverId read senderId's messages at lastReadAt"
        const messageStatus = await MessageStatus.findOne({ userId: receiverId, partnerId: senderId });
        res.json({ messages,lastReadAt: messageStatus ? messageStatus.lastReadAt : null });
    } catch (error) {
        console.error(error);
    }
  }

export const InsertMessage = async (senderid, msg, receiverid) => {
  try {
    const currenttime=new Date();
    const senderids = new mongoose.Types.ObjectId(senderid);
    const receiverids = new mongoose.Types.ObjectId(receiverid);
    const newMessage = new Message({
      sender: senderids,
      receiver: receiverids,
      content: msg,
      timestamp: currenttime,
    });
    const resu = await newMessage.save();
    if (resu) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const markMessagesAsSeen = async (req, res) => {
  const { senderId } = req.body;
  const userId = req.user.id; // the current user — the one who JUST READ the messages
  try {
    const currenttime = new Date();
    // Record: "userId last read messages from senderId at currenttime"
    // upsert:true creates the document if it doesn't exist — correct direction guaranteed
    await MessageStatus.findOneAndUpdate(
      { userId: userId, partnerId: senderId },
      { $set: { lastReadAt: currenttime } },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Messages marked as seen", lastReadAt: currenttime });
  } catch (error) {
    console.error("markMessagesAsSeen error:", error);
    res.status(500).json({ error: "Failed to mark messages as seen" });
  }
}

export const sendMessage=async (req,res) => {
    const { content, receiver } = req.body;
    const userID=req.user.id;
    try {
      const inser = await InsertMessage(userID, content, receiver);
      if(inser){
         return res.status(200).json({message:"Send Successfully"})
      }
      return res.status(400).json({message:"Something Wen't Wrong"})
    } catch (error) {
      return  res.status(500).json({message:"Internal Server Error"})
    }
}

export const searchUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const q = (req.query.q || "").trim();

    if (!q) return res.status(200).json({ users: [] });

    const regex = new RegExp(q, "i");

    const users = await User.find({
      _id: { $ne: new mongoose.Types.ObjectId(currentUserId) },
      username: { $regex: regex },
    })
      .select("_id username")
      .limit(20)
      .lean();

    if (!users.length) return res.status(200).json({ users: [] });

    const userIds = users.map((u) => u._id);

    const latestMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            {
              sender: new mongoose.Types.ObjectId(currentUserId),
              receiver: { $in: userIds },
            },
            {
              receiver: new mongoose.Types.ObjectId(currentUserId),
              sender: { $in: userIds },
            },
          ],
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $addFields: {
          otherUser: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(currentUserId)] },
              "$receiver",
              "$sender",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$content" },
          lastTime: { $first: "$timestamp" },
        },
      },
    ]);

    const latestMap = new Map(
      latestMessages.map((m) => [String(m._id), m])
    );

    const result = users.map((u) => {
      const latest = latestMap.get(String(u._id));
      return {
        _id: u._id,
        userId: u._id,
        username: u.username,
        hasConversation: Boolean(latest),
        lastMessage: latest?.lastMessage || "",
        lastTime: latest?.lastTime || null,
      };
    });

    return res.status(200).json({ users: result });
  } catch (err) {
    console.error("searchUsers error:", err);
    return res.status(500).json({ message: "Failed to search users" });
  }
};
// const insert = await Message.insertMany([
    //   {
    //     sender: userId,
    //     receiver: "699af3a263842b82b469fcb9",
    //     content: "Hello from user1!",
    //   },
    //   {
    //     sender: "699d5111d9757f5ffa75c27a",
    //     receiver: userId,
    //     content: "Hi user1, how are you?",
    //   },
    //   {
    //     sender: userId,
    //     receiver: "693d376536524d82457dc8d2",
    //     content: "Hey user3, what's up?",
    //   },
    //   {
    //     sender: "693d365836524d82457dc8c0",
    //     receiver: userId,
    //     content: "Not much, just chilling!",
    //   },
    //   {
    //     sender: userId,
    //     receiver: "6958fe592abe54158caf8645",
    //     content: "Hello user4!",
    //   },
    //   {
    //     sender: "693d351d36524d82457dc8be",
    //     receiver: userId,
    //     content: "Hi user1!",
    //   },
    // ]);