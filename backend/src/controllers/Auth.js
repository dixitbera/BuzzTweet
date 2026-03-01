
export const Auth=async (req,res)=>{
    console.log(req.user);
    res.json({
        isLoggedIn:true,
        id:req.user.id,
        username:req.user.username
    })

}