import jwt from "jsonwebtoken";

export const authMiddleware=(req,res,next)=>{
    const token=req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Not logged in" });
    }
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user=decode;
        next();
    } catch (error) {
         return res.status(401).json({ message: "Invalid token" });
    }
}