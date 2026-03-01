import User from "../models/User.js";

export const ProfileDetail=async (req,res) => {
    const userid = req.user.id;
    try{
        const data = await User.findById(userid, { password: 0 });
        res.status(200).json(data);
    }
    catch{
        res.status(500).json("Internal Server Error")
    }
}   