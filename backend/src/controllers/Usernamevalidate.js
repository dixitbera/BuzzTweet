import User from "../models/User.js";

export const Usernamevalidate=async (req,res) => {
    const { username } = req.body;
    const userid = req.user.id;
    try{
        console.log("Received username for validation:", username);
        const data = await User.findById(userid, { password: 0 });
        if(data.username===username){
            return res.status(200).json({ message: "Username is available" });

        }
        const userExists = await User.findOne({ username: username });                                                     
        if(userExists){
            res.status(200).json({message:"Username already exists"})
        }else{
            res.status(200).json({message:"Username is available"})
        }
    }catch(err){
        res.status(500).json("Internal Server Error")
    }
}

