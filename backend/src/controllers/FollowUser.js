import User from "../models/User.js";
import Follow from "../models/Follow.js";

async function updateFollowCounters(currentUserId, targetUserId, delta) {
  if (delta > 0) {
    await Promise.all([
      User.updateOne({ _id: targetUserId }, { $inc: { followers: 1 } }),
      User.updateOne({ _id: currentUserId }, { $inc: { following: 1 } }),
    ]);
    return;
  }

  await Promise.all([
    User.updateOne(
      { _id: targetUserId, followers: { $gt: 0 } },
      { $inc: { followers: -1 } }
    ),
    User.updateOne(
      { _id: currentUserId, following: { $gt: 0 } },
      { $inc: { following: -1 } }
    ),
  ]);
}

export const getFollowStatus = async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user?.id;

  try {
    const targetUser = await User.findOne({ username }, { _id: 1 });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isOwnProfile = targetUser._id.toString() === currentUserId?.toString();
    if (isOwnProfile) {
      return res.status(200).json({ isFollowing: false, isOwnProfile: true });
    }

    const followRecord = await Follow.findOne({
      follower: currentUserId,
      following: targetUser._id,
    });

    return res.status(200).json({
      isFollowing: Boolean(followRecord),
      isOwnProfile: false,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const setFollowStatus = async (req, res) => {
  const { username } = req.params;
  const { follow } = req.body;
  const currentUserId = req.user?.id;

  if (typeof follow !== "boolean") {
    return res
      .status(400)
      .json({ message: "Invalid follow request payload" });
  }

  try {
    const targetUser = await User.findOne({ username }, { _id: 1 });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser._id.toString() === currentUserId?.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const existing = await Follow.findOne({
      follower: currentUserId,
      following: targetUser._id,
    });

    if (follow) {
      if (!existing) {
        await Follow.create({ follower: currentUserId, following: targetUser._id });
        await updateFollowCounters(currentUserId, targetUser._id, 1);
      }
    } else if (existing) {
      await Follow.deleteOne({ _id: existing._id });
      await updateFollowCounters(currentUserId, targetUser._id, -1);
    }

    const updatedTargetUser = await User.findById(targetUser._id, {
      followers: 1,
    });

    return res.status(200).json({
      isFollowing: follow,
      followers: updatedTargetUser?.followers || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
