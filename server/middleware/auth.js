import User from "../models/User.js";
import jwt from 'jsonwebtoken'

//Middleware to protect routes
export const protectRoute = async (req,res,next)=>{
    try {
         const token = req.headers.token;
         // ✅ Debug log for token
          console.log("🛡️ Incoming Token:", token);

           if (!token) {
             return res.status(401).json({ success: false, message: "Token not provided in header" });
           }

         const decoded = jwt.verify(token, process.env.JWT_SECRET)
         console.log("✅ Decoded JWT:", decoded);
         const user =await User.findById(decoded.userId).select("-password");
         if(!user) return res.status(404).json({success:false,message: "User not found"})
        req.user=user;
        next();
    } catch (error) {
         console.log(error.message);
    
         return res.status(401).json({success:false, message:error.message})
    }
}
