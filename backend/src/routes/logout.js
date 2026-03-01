import express from "express";
// import { authMiddleware } from "../middleware/Auth.js";
// import { Auth } from "../controllers/Auth.js";
import { Logout } from "../controllers/Logout.js";
const router=express();

router.post("/logout",Logout);

export default router;