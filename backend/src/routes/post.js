import express, { Router } from "express";
import { Postf } from "../controllers/Post.js";
import { authMiddleware } from "../middleware/Auth.js";
import { Createpost } from "../controllers/Createpost.js";
import { Likepost } from "../controllers/Likepost.js";
import { optionalauthMiddleware } from "../middleware/OAuth.js";
import { UserPost } from "../controllers/UserPost.js";
import { UpdatePost } from "../controllers/UpdatePost.js";
import { DeletePost } from "../controllers/DeletePost.js";
import multer  from "multer";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime()+ file.originalname);
  },
});
const upload = multer({ storage });

const router=express.Router();

router.get("/post", optionalauthMiddleware,Postf);
router.get("/user/post/", optionalauthMiddleware,UserPost);
router.post("/post", authMiddleware, upload.single("file"), Createpost);
router.patch("/post", authMiddleware,Likepost);
router.delete("/post/delete", authMiddleware, DeletePost);
router.patch("/post/update", authMiddleware,UpdatePost);

export default router;