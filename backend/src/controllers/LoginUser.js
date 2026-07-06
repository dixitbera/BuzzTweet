import User from "../models/User.js";
import bcrypt, { compare } from "bcrypt";
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

export const LoginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const find = await User.findOne({ username: username });
    if (!find) return res
      .status(401)
      .json({ flag: false, message: "Invalid credentials " });
    const compare = await bcrypt.compare(password, find.password);
    if (!compare) return res.status(401).json({ flag: false, message: "invalid credentials " });

    const token = jwt.sign({ id: find._id, username: find.username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.json({
      flag: true,
      message: "Login success",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.json({ flag: false, message: "Fail" });
  }
}