import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
     sender: {
    type: mongoose.Schema.Types.ObjectId,       
    required: true,
    ref: "User",
    },
    receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
    },
    content: {
    type: String,
    required: true,
    },
    seen: {
    type: Boolean,
    default: false,
    },
    timestamp: {
    type: Date,
    default: Date.now,
    },
});

MessageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });

export default mongoose.model("Message", MessageSchema);