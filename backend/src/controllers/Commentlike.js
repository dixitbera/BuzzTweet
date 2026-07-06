import CommentLike from "../models/CommentLike.js";
import Comment from "../models/Comment.js";

export const comlike=async (req,res)=>{
      const {commentid}=req.body;
        const userid=req.user.id;
        try {
                const find = await CommentLike.exists({
                  commentid: commentid,
                  userid: userid,
                });
                if (find) {
                      const remove=await CommentLike.deleteOne({commentid:commentid,userid:userid});
                        const likecount = await Comment.updateOne({
                          _id: commentid},
                          {$inc: { likecount: -1 }
                        });
                }else{
                        const insert=await CommentLike.create({commentid:commentid,userid:userid});
                        const likecount = await Comment.updateOne({
                          _id: commentid},
                          {$inc: { likecount: 1 }
                        });
                }
                res.status(200).json({ message: "Comment like toggled" })
        } catch (error) {
                console.error("Comment like error:", error);
                res.status(500).json({ message: "Internal Server Error" });
        }
}