import { asyncHandler } from "../utlis/asyncHandler.js";
import {ApiError} from "../utlis/ApiError.js"
import { User } from "../modles/user.models.js";
import { uploadOnCloud } from "../utlis/Cloudinary.js";
import { ApiResponse } from "../utlis/ApiResponse.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};


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

const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email
    //find the user
    //passowrd check
    //access token or refresh token
    //send cookie

    const {email, username, password} = req.body;

    if(!(username || email)){
        throw new ApiError(400, "username or email is required");
    }


    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid Password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //to make cookies only modifiable from server
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options) //key value
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, //status code
            {
                user: loggedInUser, //data
                accessToken, //data
                refreshToken //data
            },
            "User logged in successfully"
        )
    )

})  

const logoutUser = asyncHandler(async(req, res) => {
  //removing refresh token from database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      //to get updated user(here to get user with refresh token undefined)
      new: true,
    }
  );

  //to make cookies only modifiable from server
  //clearing the cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res.status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User Logged Out Sucessfully"))
})

const refreshAccessToken = asyncHandler(async(req, res, next) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Requst");
    }

    try {

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user )
        {
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incomingToken !== user?.refreshToken)
        {
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const {newAccessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user, incomingToken)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res.status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                },
                "Access Token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export {registerUser, loginUser, logoutUser, refreshAccessToken} 