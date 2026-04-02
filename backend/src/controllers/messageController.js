import Message from "../models/Message.js";
import mongoose from "mongoose";
import MessageStatus from "../models/MessageStatus.js"; 
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
    // console.log(reciverid) 
    const senderId = req.user.id;
    const receiverId = new mongoose.Types.ObjectId(reciverid);
    try { 
        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        }).populate("sender", "username").populate("receiver", "username").sort({ timestamp: 1 });
        const messageStatus = await MessageStatus.findOne({ userId: senderId, partnerId: receiverId });
        // console.log("Message status for user:", messageStatus);
        // console.log("Fetched messages for user:", messages);
        res.json({ messages,lastReadAt: messageStatus ? messageStatus.lastReadAt : null });
    } catch (error) {
        console.log(error)    
    }
  }
export const InsertMessage = async (senderid, msg, receiverid) => {
  try {
    // console.log(senderid,"c",receiverid)
    const currenttime=new Date();
    const senderids = new mongoose.Types.ObjectId(senderid);
    const receiverids = new mongoose.Types.ObjectId(receiverid);
    const newMessage = new Message({
      sender: senderids,
      receiver: receiverids,
      content: msg,
      timestamp: currenttime,
    });
    // console.log("New message document:", newMessage);
    const resu = await newMessage.save();
    // console.log("Message saved to database:", resu);
    if (resu) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const markMessagesAsSeen = async (req,res) => {
  const { senderId } = req.body;
  const userId = req.user.id;
  console.log("Marking messages as seen from sender:", senderId, "to receiver:", userId);
  try{  
    const currenttime = new Date();
    const result = await MessageStatus.findOneAndUpdate(
      { userId: userId, partnerId: senderId },
      { lastReadAt: currenttime },);
      const insertstatus=undefined;
      if(!result){
         insertstatus = await MessageStatus.insertOne({
           userId: senderId,
           partnerId: userId,
           lastReadAt: currenttime,
         });
          // console.log("Message status inserted:", insertstatus);
      }
      if(!result && !insertstatus){
        //console.log("Failed to update or insert message status");
        return res.status(500).json({ error: "Failed to update message status" });
      }
      res.status(200).json({ message: "Messages marked as seen" ,lastReadAt:currenttime});
   // console.log("Message status updated:", result);
  } catch(error){
    res.status(500).json({ error: "Failed to mark messages as seen" });
  }
}

export const sendMessage=async (req,res) => {
    const { content, receiver } = req.body;
    const userID=req.user.id;
    try {
      const inser = InsertMessage(userID, content, receiver);
      if(inser){
         return res.status(200).json({message:"Send Successfully"})
      }
      return res.status(400).json({message:"Something Wen't Wrong"})
    } catch (error) {
      return  res.status(500).json({message:"Internal Server Error"})
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