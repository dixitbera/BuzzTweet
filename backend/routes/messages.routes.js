const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User"); // adjust if your file name differs
const Message = require("../models/Message"); // adjust if your file name differs
const { isAuthenticated } = require("../middleware/auth"); // adjust middleware name/path

// ...existing code...

router.get("/search-users", isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.user.id; // adjust if you store user id differently
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
      { $sort: { createdAt: -1 } },
      {
        $project: {
          content: 1,
          createdAt: 1,
          sender: 1,
          receiver: 1,
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
          lastTime: { $first: "$createdAt" },
        },
      },
    ]);

    const latestMap = new Map(
      latestMessages.map((m) => [String(m._id), m]),
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
    return res.status(500).json({ message: "Failed to search users" });
  }
});

// ...existing code...
module.exports = router;