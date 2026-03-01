import User from "../models/User.js";
import bcrypt, { compare } from "bcrypt";
import jwt from "jsonwebtoken";
export const LoginUser= async (req,res) => {
    const { username, password } = req.body;    
    try {
        const find =await User.findOne({username:username});
        if(!find) return res
          .status(401)
          .json({ flag: false, message: "Invalid credentials " });
        const compare=await bcrypt.compare(password,find.password);
        if(!compare) return res.status(401).json({flag:false,message:"invalid credentials "});

          const token = jwt.sign({ id: find._id,username:find.username }, process.env.JWT_SECRET, {
            expiresIn: "1h",
          });
           res.cookie("token", token, {
             httpOnly: true, // JS cannot access
             secure: false, // true in production (HTTPS)
             sameSite: "lax", // CSRF protection
             maxAge: 30 * 24 * 60 * 60 * 1000, // 1 day
           });
           res.json({
             flag:true,
             message: "Login success",
           });
    } catch (error) {
        res.json({ flag: false, message: "Fail" });
    }
}