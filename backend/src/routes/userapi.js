import express from "express";
import { CreateUser } from "../controllers/CreateUser.js";
const router=express.Router();

router.post("/register",CreateUser)

export default router;