

export const Logout=(req,res)=>{
    res.clearCookie('token');
    res.json({msg:"Logout"});
}