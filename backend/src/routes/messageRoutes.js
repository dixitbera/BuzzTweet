import express from "express";
import { sendMessage } from "../controllers/messageController.js";
import {authMiddleware} from "../middleware/Auth.js";
import { getMessages } from "../controllers/messageController.js";
import { getMessagesuser } from "../controllers/messageController.js";
import { markMessagesAsSeen } from "../controllers/messageController.js";
import { get } from "http";
const router = express.Router();

router.post("/send", sendMessage);
router.get("/messages", authMiddleware, getMessages);
router.post("/messages/user", authMiddleware, getMessagesuser);
router.post("/messages/seen", authMiddleware, markMessagesAsSeen);
export default router;
