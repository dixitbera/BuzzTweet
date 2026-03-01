import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  image:{
    type:String
  },
  content: {
    type: String,
    required: true,
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  CommentCount: {
    type: Number,
    default: 0,
  },
  PostAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Post", PostSchema);
