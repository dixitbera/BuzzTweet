import Post from "../models/Post.js";
import Likes from "../models/Like.js";

export const Likepost=async (req,res) => {
    const {like,postid}=req.body;
    const userid=req.user.id;
    try {
        const find = await Likes.findOne({
          likedby: userid,
          postid: postid}); 
        if (find) {
            const cs =await Likes.deleteOne({likedby:userid,postid:postid})
            const likecount=await Post.updateOne({_id:postid},{$inc:{likeCount:-1}})
        }else{
            const cs = await Likes.insertOne({
              postid: postid,
              likedby: userid
            });
             const likecount = await Post.updateOne(
               { _id: postid },
               { $inc: { likeCount: 1 } }
             );
        }
        res.status(200).json()
    } catch (error) {
        res.status(500).json("Internal Server Error");
    }
}