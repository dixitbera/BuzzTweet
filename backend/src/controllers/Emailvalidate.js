import User from "../models/User.js";

export const Emailvalidate=async (req,res) => {
    const { email } = req.body;
    try{
        const data=await User.findOne({email:email});
        if(data){
            res.status(200).json({message:"email already exists"})
        }else{
            res.status(200).json({message:"email is available"})
        }
    }catch{
        res.status(500).json("Internal Server Error")
    }
}