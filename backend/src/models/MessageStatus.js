import mongoose from "mongoose";

const messageStatusSchema = new mongoose.Schema(
  {
    // the user receiving messages
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // the partner who sends messages
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // last message delivered to this user
    lastDeliveredAt: {
      type: Date,
      default: null,
    },

    // last message read by this user
    lastReadAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// prevent duplicate rows
messageStatusSchema.index({ userId: 1, partnerId: 1 }, { unique: true });

export default mongoose.model("MessageStatus", messageStatusSchema);
