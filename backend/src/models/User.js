import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: String,
    bio: String,
    avatar: String,
    postcount:{type:Number,default:0},
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("User",UserSchema);
