import Message from "../models/Message.js";
import mongoose from "mongoose";
// export const sendMessage = (req, res) => {
//   const { message } = req.body;

//   console.log("Route received:", message);

//   // get socket instance
//   const io = req.app.get("io");
  
//   // emit message to all connected clients
//   io.emit("message", message);

//   res.json({ status: "Message sent" });
// };

export const getMessages = async (req, res) => {
  // For demonstration, we return a static list of messages
  const id = req.user.id; // Get user ID from authenticated request
  const userId =new mongoose.Types.ObjectId(id); // Convert to ObjectId
  // console.log("Authenticated user ID:", userId);
  try {
    // console.log("Fetching messages for user ID:", userId);  
    
    // console.log(userId)
 const chats = await Message.aggregate([
   {
     $match: {
       $or: [{ sender: userId }, { receiver: userId }],
     },
   },

   {
     $addFields: {
       chatUser: {
         $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
       },
     },
   },

   // ✅ sort by timestamp BEFORE grouping
   { $sort: { timestamp: -1 } },

   {
     $group: {
       _id: "$chatUser",
       lastMessage: { $first: "$content" },
       lastTime: { $first: "$timestamp" },
     },
   },

   {
     $lookup: {
       from: "users",
       localField: "_id",
       foreignField: "_id",
       as: "user",
     },
   },
   { $unwind: "$user" },

   {
     $project: {
       _id: 0,
       userId: "$user._id",
       username: "$user.username",
       lastMessage: 1,
       lastTime: 1,
     },
   },

   // ✅ sort chat list by last message time
   { $sort: { lastTime: -1 } },
 ]);
    // console.log("Aggregated message list:", chats);
    res.json({ messages: chats });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
  // res.json(messages);
} 

export const getMessagesuser = async (req, res) => {
    const {reciverid}=req.body;
    console.log(reciverid) 
    const senderId = req.user.id;
    const receiverId = new mongoose.Types.ObjectId(reciverid);
    try { 
        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        }).populate("sender", "username").populate("receiver", "username").sort({ timestamp: 1 });
        console.log("Fetched messages for user:", messages);
        res.json({ messages });
    } catch (error) {
        console.log(error)    
    }
  }
export const InsertMessage=async (msg) => {
  try {
    console.log("Inserting message into database:", msg);
    const senderid=new mongoose.Types.ObjectId(msg.sender._id);
    const receiverid=new mongoose.Types.ObjectId(msg.receiver);
    const newMessage = new Message({  
      sender: senderid,
      receiver: receiverid,
      content: msg.content,
      timestamp: msg.timestamp,
    });
    console.log("New message document:", newMessage);
    const resu=await newMessage.save();
    console.log("Message saved to database:", resu);
  } catch (error) {
    console.log(error);
  }
}

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
    // console.log("Inserted messages:", insert);