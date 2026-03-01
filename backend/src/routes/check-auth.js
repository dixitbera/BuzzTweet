import express from "express";
import { authMiddleware } from "../middleware/Auth.js";
import { Auth } from "../controllers/Auth.js";
const router=express();

router.get("/check-auth", authMiddleware,Auth);

export default router;