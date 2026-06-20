
export const Auth=async (req,res)=>{
    res.json({
        isLoggedIn:true,
        id:req.user.id,
        username:req.user.username
    })

}