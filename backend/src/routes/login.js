import express from "express";
import { LoginUser} from "../controllers/LoginUser.js";
const router=express.Router();

router.post("/login",LoginUser)

export default router;