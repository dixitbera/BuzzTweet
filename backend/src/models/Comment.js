import mongoose, { Mongoose } from "mongoose";

const CommnetSchema=new mongoose.Schema({
    postid:{type: mongoose.Schema.Types.ObjectId,ref:"Post"},
    userid:{type: mongoose.Schema.Types.ObjectId,ref:"User"},
    comment:{type:String,require:true},
    replayid:{type: mongoose.Schema.Types.ObjectId,ref:"User"},
    commentat:{
        type:Date,
        default:Date.now
    },
    likecount:{type:Number,default:0},
})


export default mongoose.model("Comment", CommnetSchema);