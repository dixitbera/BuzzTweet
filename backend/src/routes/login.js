import express from "express";
import { LoginUser} from "../controllers/LoginUser.js";
const router=express();

router.post("/login",LoginUser)

export default router;