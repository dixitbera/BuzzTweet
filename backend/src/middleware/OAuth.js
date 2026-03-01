import jwt from "jsonwebtoken";

export const optionalauthMiddleware=(req,res,next)=>{
    const token=req.cookies.token;
    if (!token) {
        req.user=null;
        next();
    }
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user=decode;
        next();
    } catch (error) {
        req.user=null;
        next();
    }
}