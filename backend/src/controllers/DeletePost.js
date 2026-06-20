import Post from "../models/Post.js";
import fs from "fs/promises";
import path from "path";
import User from "../models/User.js"
import { Console } from "console";

export const DeletePost = async (req, res) => {
  try {
    const { postid } = req.body;
    const post = await Post.findById(postid);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }   
    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const postimage=post?.image;
    await Post.findByIdAndDelete(postid);
    if (postimage) {
      const filePath = path.join(process.cwd(), "uploads",postimage);
      try {
        const ver=await fs.unlink(filePath);
      } catch (err) {
      }
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};