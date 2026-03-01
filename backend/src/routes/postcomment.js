import { authMiddleware } from "../middleware/Auth.js";
import express from "express";
import { Commentcrate } from "../controllers/Commentcrate.js";
import { optionalauthMiddleware } from "../middleware/OAuth.js";
import { CommentLoad } from "../controllers/Commentload.js";
import { comlike } from "../controllers/Commentlike.js";
const router = express();

router.post("/post/comment", authMiddleware, Commentcrate);  
router.get("/post/comment", optionalauthMiddleware, CommentLoad);  
router.post("/post/commentlike", authMiddleware, comlike);  

export default router;