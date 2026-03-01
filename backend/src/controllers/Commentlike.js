import CommentLike from "../models/CommentLike.js";
import Comment from "../models/Comment.js";

export const comlike=async (req,res)=>{
      const {commentid}=req.body;
        const userid=req.user.id;
        console.log(userid)
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
                        console.log(remove + " " + likecount);
                }else{
                        const insert=await CommentLike.insertOne({commentid:commentid,userid:userid});
                        const likecount = await Comment.updateOne({
                          _id: commentid},
                          {$inc: { likecount: 1 }
                        });
                         console.log(likecount);
                }
                res.json({msg:"Done Bhai"})
        } catch (error) {
                console.log(error)
                res.json({ msg: "Nahi Ho Raha Bhai" });
        }
}