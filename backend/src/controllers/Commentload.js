import Comment from "../models/Comment.js";
import CommentLike from "../models/CommentLike.js";

 export const CommentLoad=async (req,res)=>{
   const { postid, cursor } = req.query;
   const userid=req.user ;
    let query = { postid: postid };
  console.log(cursor)
   try {
      if (cursor) {
        query.commentat = { $lt: new Date(cursor) };
      }
      
      const commdata = await Comment.find( query )
        .sort({ commentat: -1 })
        .populate("userid", "username")
        .limit(10);
        const setcursor =commdata.length < 10 ? null : commdata[commdata.length - 1].commentat;
        const hasmore =commdata.length < 10 ? false :true;
        let newcomm=commdata;
        if (userid) {
              const idarr=commdata.map((com)=> com._id.toString());
              const newarrliked = await CommentLike.find({commentid:{$in:idarr},userid:userid.id});
              const setofid=new Set(newarrliked.map((newarr)=> newarr.commentid.toString()));
              newcomm= commdata.map((com) => ({
              ...com.toObject(),
              liked:setofid.has(com._id.toString())
              }))
        }
      res.json({ newcomm, setcursor ,hasmore});
    //  console.log(commdata);
   } catch (error) {
     console.log(error)
   }
    function isValidCookieTime(value) {
      if (typeof value !== "string") return false;

      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

      if (!isoRegex.test(value)) return false;

      const date = new Date(value);
      if (isNaN(date.getTime())) return false;

      // Optional: reject future times
      if (date.getTime() > Date.now()) return false;

      return true;
    }
}
