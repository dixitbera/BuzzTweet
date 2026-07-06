
const isProduction = process.env.NODE_ENV === "production";

export const Logout=(req,res)=>{
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
    });
    res.json({msg:"Logout"});
}