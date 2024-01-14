import { asyncHandler } from "../utlis/asyncHandler.js";
import {ApiError} from "../utlis/ApiError.js"
import { User } from "../modles/user.models.js";
import { uploadOnCloud } from "../utlis/Cloudinary.js";
import { ApiResponse } from "../utlis/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) =>{
    // get user details from frontend
    // validation - not empty
    // check if user already exit: username, email
    // check for images, check for avatar
    // upload them on cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return

    const {fullName, email, username, password} = req.body
    console.log("email: " , email)
    console.log("password: ", password);
    console.log("username: ", username);
    console.log("fullname: " , fullName)


    if(
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    
    if(existedUser)
    {
        throw new ApiError(409, "User with username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const converImageLocalPath = req.files?.coverImage[0]?.path;

    // console.log(req.files)

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloud(avatarLocalPath)
    const coverImage = await uploadOnCloud(converImageLocalPath)

    if(!avatar)
    {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName, 
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering User")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Sucessfully")
    )

})

export {registerUser}