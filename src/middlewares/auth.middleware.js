import jwt from "jsonwebtoken"
import { ApiError } from "../utlis/ApiError.js"
import { asyncHandler } from "../utlis/asyncHandler.js"
import { User } from "../modles/user.models.js"

export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401,"Unauthorized Requst")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user)
        {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next();
    } 
    catch (error) {
        throw new ApiError(401, "Invalid Access Token");
    }
})