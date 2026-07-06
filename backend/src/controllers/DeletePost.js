import Post from "../models/Post.js";
import fs from "fs/promises";
import path from "path";
import User from "../models/User.js"

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
    await User.updateOne({ _id: req.user.id, postcount: { $gt: 0 } }, { $inc: { postcount: -1 } });
    if (postimage) {
      const filePath = path.join(process.cwd(), "uploads",postimage);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error("Failed to delete image file:", err.message);
      }
    }
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};