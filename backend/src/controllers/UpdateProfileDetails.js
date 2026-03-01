import User from "../models/User.js";

export const UpdateProfileDetails = async (req, res) => {
  const userid = req.user.id;
  const { username, email,bio } = req.body;
  console.log( "Received update request with username:",username,"and email:",email, "and bio:", bio);
  
  try {
    const user = await User.findById(userid).select("-password -__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check if the new username is taken by another user
    const usernamelength = username ? username.length : 0;
    if (usernamelength > 20) {
      return res.status(400).json({ message: "Username must be less than 20 characters" });
    }
    if (usernamelength<4) {
        return res.status(400).json({ message: "Username must be at least 4 characters" });
    }
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      } else {
        user.username = username;
      } 
    }
    // Check if the new email is taken by another user
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !regex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (email && email !== user.email) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        return res.status(400).json({ message: "Email already exists" });
      } else {
        user.email = email;
      }
    }
    if (bio.length<50) {
      user.bio = bio;
    }else{
      return res.status(400).json({ message: "Bio must be less than 50 characters" });
    }
    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user });    
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
















// const updatedUser = await User.findByIdAndUpdate(
//   userid,
//   { username, email },
//   { new: true },
// );
// res
//   .status(200)
//   .json({ message: "Profile updated successfully", user: updatedUser });