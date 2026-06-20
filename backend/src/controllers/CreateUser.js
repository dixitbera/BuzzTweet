import User from "../models/User.js";
import bcrypt from "bcrypt";
export const CreateUser= async (req,res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ flag: false, message: "Missing required fields" });
    }
    const salt=10;
    try {


        const hashpass=await bcrypt.hash(password,salt);
        
        const db=await User.create({username:username,email:email,password:hashpass})
        if(db){
            res.json({flag:true,message:"Register Success"})        
        }else{
             res.json({flag:false, message: "Fail" });
        }
    } catch (error) {
        res.json({ flag: false, message: "Fail" });
    }
}