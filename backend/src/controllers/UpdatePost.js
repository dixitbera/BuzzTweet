import Post from "../models/Post.js";

export const UpdatePost = async (req, res) => {
  try {
    console.log("UpdatePost called with body:", req.body);
    console.log("Authenticated user:", req.user);
    const { postid, content } = req.body;
    const post = await Post.findById(postid);
    console.log("Post found:", post);
    if (!post) {    
        return res.status(404).json({ message: "Post not found" });
    }   
    if (post.author.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Unauthorized" });
    }   
    post.content = content;
    await post.save();
    res.status(200).json({ message: "Post updated successfully", post, flag: true });

    } catch (error) {   
        console.error("Error updating post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};