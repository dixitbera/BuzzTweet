import Post from "../models/Post.js";
import User from "../models/User.js";
import Likes from "../models/Like.js"

export const ProfileDetail = async (req, res) => {
  const userid = req.user.id;
  try {
    const data = await User.findById(userid, { password: 0 });
    res.status(200).json(data);
  } catch {
    res.status(500).json("Internal Server Error");
  }
};

export const PreviewProfile = async (req, res) => {
  const { author } = req.body;
  try {
    const data = await User.findById(author, {
      username: 1,
      followers: 1,
      following: 1,
      postcount: 1,
    });
    if (!data) return res.status(404).json({ message: "User not found" });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json("Internal Server Error");
  }
};

export const ProfileOfotheruser = async (req, res) => {
  const { username } = req.params;
  try {
    const find = await User.findOne(
      { username: username },
      { password: 0, email: 0 }
    );
    if (!find) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(find);
  } catch (error) {
    res.status(500).json("Internal Server Error");
  }
};

export const PostOfSpecifUser=async (req,res) => {
      const { username } = req.body;
    let { cursor } = req.query;
  const userid = req.user;
 let userfindid =undefined;
    console.log(username,cursor)
  let query = {};
  if (isValidCookieTime(cursor)) {
    query.PostAt = { $lt: new Date(cursor) };
  }
  try {
    console.log(username);
    const find = await User.findOne({ username: username });
    if (!find) {
     return res.status(404).json({ message: "User not found" });
    }
    userfindid=find._id;
    query.author=userfindid;
    const data = await Post.find(query)
      .sort({ PostAt: -1 })
      .populate("author", "username")
      .limit(10);
      const postids = data.map((post) => post?._id);
      console.log(data);
    let findliked = [];
    if (userid?.id) {
      findliked = await Likes.find({
        likedby: userid?.id,
        postid: { $in: postids },
      });
    }
    const likedpostids = new Set(
      findliked.map((post) => post.postid.toString()),
    );
    const dataf = data.map((post) => ({
      ...post.toObject(),
      // postcom: groupbycomm[post?._id.toString()],
      liked: likedpostids.has(post?._id.toString()),
    }));
    const hasmore = dataf.length == 10;
    let cursorb = undefined;
    if (hasmore) {
      cursorb = data[dataf.length - 1].PostAt;
    }
    res.status(200).json({ dataf, hasmore, cursorb });
    }catch{
        res.status(500).json("Internal Server Error")
    }
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
