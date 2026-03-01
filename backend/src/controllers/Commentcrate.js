import comment from "../models/Comment.js";
import Post from "../models/Post.js";

export const Commentcrate=async (req,res)=>{
    const {postid,commentText} =req.body;
    const userID=req.user.id;
    try {
        const submit = await comment.insertOne({
          postid: postid,
          userid: userID,
          comment: commentText,
        });
        const commentlike = await Post.updateOne(
          { _id: postid },
          { $inc: { CommentCount :1} }
        );
          res.status(200).json({ flag: true, msg: "success" });
    } catch (error) {
        res.status(200).json("Internal Serever Error");
    }
}