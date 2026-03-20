import express from "express";
import { authMiddleware } from "../middleware/Auth.js";
import { PostOfSpecifUser, ProfileDetail } from "../controllers/ProfileDetail.js";
import { PreviewProfile } from "../controllers/ProfileDetail.js";
import { Usernamevalidate } from "../controllers/Usernamevalidate.js";
import { UpdateProfileDetails } from "../controllers/UpdateProfileDetails.js";
import { Emailvalidate } from "../controllers/Emailvalidate.js";
import { Changepassword } from "../controllers/Changepassword.js";
import { ProfileOfotheruser } from "../controllers/ProfileDetail.js";
import { getFollowStatus, setFollowStatus } from "../controllers/FollowUser.js";


const router=express.Router();
router.use(authMiddleware);
router.get("/profile",ProfileDetail);
router.post("/profile/username",Usernamevalidate);
router.patch("/profile/update", UpdateProfileDetails);
router.post("/profile/email",Emailvalidate);    
router.post("/profile/changepassword", Changepassword);
router.post("/api/user/preview", PreviewProfile);
router.get("/api/u/:username", ProfileOfotheruser);
router.post("/api/u/post", PostOfSpecifUser);
router.get("/api/u/:username/follow-status", getFollowStatus);
router.post("/api/u/:username/follow", setFollowStatus);



export default router;