import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { isPasswordStrong } from "../validtion/vd.js";

export const Changepassword = async (req, res) => {
  const userid = req.user.id;
  const { oldpass, newpass } = req.body;

  try {
    if (!oldpass || !newpass)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const user = await User.findById(userid);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed" });

    const match = await bcrypt.compare(oldpass, user.password);
    if (!match)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    if (oldpass === newpass)
      return res
        .status(400)
        .json({ success: false, message: "New password must differ from old" });

    if (!isPasswordStrong(newpass))
      return res
        .status(400)
        .json({ success: false, message: "Password not strong" });

    const hashpass = await bcrypt.hash(newpass, 10);

    const result = await User.updateOne(
      { _id: userid },
      { $set: { password: hashpass } },
    );

    if (result.modifiedCount === 0)
      return res
        .status(500)
        .json({ success: false, message: "Password update failed" });

    return res.status(200).json({ success: true, message: "Password changed" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
