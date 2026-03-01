import Post from "../models/Post.js";
import Likes from "../models/Like.js";

export const UserPost=async (req,res) => {  
   let {cursor}=req.query;
       const userid=req.user;
   
       let query = { author : userid?.id };
         if (isValidCookieTime(cursor)) {
          query.PostAt = { $lt: new Date(cursor) };
         }

       try {
           const data = await Post.find(query)
             .sort({ PostAt: -1 })
             .populate("author", "username")
             .limit(10);
            console.log(data)
           const postids=data.map((post)=> post?._id);
   
           let findliked=[]
           if (userid?.id) {
              findliked = await Likes.find({
               likedby: userid?.id,
               postid: { $in: postids },
             });
             
           }
           
           //  const findcomment = await Comment.find({ postid: { $in: postids } })
           //    .populate("userid", "username")
           //    .sort({ commentat : -1});
           //  const groupbycomm=Object.groupBy(findcomment, com => com?.postid.toString());
           // // console.log(groupbycomm);
           const likedpostids =new Set(findliked.map((post)=> post.postid.toString()))
           const dataf = data.map((post) => ({
             ...post.toObject(),
             // postcom: groupbycomm[post?._id.toString()],
             liked: likedpostids.has(post?._id.toString()),
           }));  
           const hasmore = dataf.length == 10;
           let cursorb=undefined;
           if(hasmore){
                 cursorb = data[dataf.length-1].PostAt;
           }
           
           res.status(200).json({  dataf,hasmore,cursorb})
       } catch (error) {
           console.log(error)
           res.status(500).json("Server Error");
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