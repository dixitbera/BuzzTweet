import express from "express";
import { authMiddleware } from "../middleware/Auth.js";
import { ProfileDetail } from "../controllers/ProfileDetail.js";
import { Usernamevalidate } from "../controllers/Usernamevalidate.js";
import { UpdateProfileDetails } from "../controllers/UpdateProfileDetails.js";
import { Emailvalidate } from "../controllers/Emailvalidate.js";
import { Changepassword } from "../controllers/Changepassword.js";

const router=express.Router();
router.use(authMiddleware);
router.get("/profile",ProfileDetail);
router.post("/profile/username",Usernamevalidate);
router.patch("/profile/update", UpdateProfileDetails);
router.post("/profile/email",Emailvalidate);    
router.post("/profile/changepassword", Changepassword);


export default router;