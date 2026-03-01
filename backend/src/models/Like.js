import mongoose from "mongoose";

const Likeschema = new mongoose.Schema({
  postid:{type: mongoose.Schema.Types.ObjectId,ref:"Post"},
  likedby: {type:mongoose.Schema.Types.ObjectId,ref:"User"},
  likedAt: {
    type:Date,
    default:Date.now
  }
});

Likeschema.index(
  {likedby:1,postid:1},
  {unique:true}
)

export default mongoose.model("Likes",Likeschema);