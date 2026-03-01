import mongoose from "mongoose";

const CommentLikeSchema = new mongoose.Schema({
  commentid: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  likedAt: {
    type: Date,
    default: Date.now,
  },
}); 
CommentLikeSchema.index({ commentid: 1, userid: 1 },{unique:true});

export default mongoose.model("CommnetLike", CommentLikeSchema);