import User from "../models/User.js";
import bcrypt from "bcrypt";
export const CreateUser= async (req,res) => {
    const { username, email, password } = req.body;
    const salt=10;
    try {


        const hashpass=await bcrypt.hash(password,salt);
        
        const db=await User.insertOne({username:username,email:email,password:hashpass})
        if(db){
            res.json({flag:true,message:"Register Success"})        
        }else{
             res.json({flag:false, message: "Fail" });
        }
    } catch (error) {
        res.json({ flag: false, message: "Fail" });
    }
}