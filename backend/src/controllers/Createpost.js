import Post from "../models/Post.js";
import User from "../models/User.js";


export const Createpost = async (req,res) => {
    const filename = req.file?.filename;  
    const userid = req.user?.id;
    const {postcontent}=req.body;
    let query = { author: userid, content: postcontent };
    if (filename) {
        query.image=filename;
    }
    try {
        const postsub = await Post.insertOne(query);
        const updatePostCount=await User.updateOne({_id:userid},{$inc:{postcount:1 }})
        res.status(200).json({ flag: true, msg: "success" });
    } catch (error) {
        res.status(500).json({msg:"sdf"})
    }
    
}   