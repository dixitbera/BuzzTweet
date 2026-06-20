import express from "express";
import {
  sendMessage,
  getMessages,
  getMessagesuser,
  markMessagesAsSeen,
  searchUsers,
} from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/Auth.js";

const router = express.Router();

router.post("/send", authMiddleware, sendMessage);
router.get("/messages", authMiddleware, getMessages);
router.post("/messages/user", authMiddleware, getMessagesuser);
router.post("/messages/seen", authMiddleware, markMessagesAsSeen);
router.get("/messages/search-users", authMiddleware, searchUsers);

export default router;

