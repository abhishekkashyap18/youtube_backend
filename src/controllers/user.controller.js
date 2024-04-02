import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { response } from "express";

const generateAccessRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken =  user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();

        //refresh token -> database me add kr diya
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })   //jab hum save krate hai to mongoose ka model kicking ho jate hai, to aisa na ho uske liye hum validate false kar dete hai
    

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }
}


const registerUser = asyncHandler( async (req, res) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exists: username, email
    //check for images , check for avatar 
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation 
    //return response


    
// 1. ** get user details from frontend **
    //form/json se data aaraha to vo body se mil jaiyega, url se aaraha hai to uske liye alag technique hai
    
    const { fullName, email, username, password } = req.body
    

// 2. **validation**
    //hur field ko isi tarah multiple if laga k validate kar sakte hai, yehh to hai beginner friendly way
    // if(fullName === ""){
    //     throw new ApiError(400, "fullname is required")
    // }

    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

//3. **check if user already exists**
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists");
    }

// 4. **check for images , check for avatar **
     //multer hume directly req.files ka access de deta hai,
     //jaise express hume req.body ka access de deta hai
     const avatarLocalPath = req.files?.avatar[0]?.path;
    //  const coverImageLocalPath = req.files?.coverImage[0]?.path;     //cause error when coverImage is missing

    //1st way of correcting the above error
    //  const coverImageLocalPath = req.files?.coverImage?.coverImage[0]?.path;

    //2nd way of correcting the above error
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


     if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
     }



// 5. **upload them to cloudinary, avatar**
      const avatar = await uploadOnCloudinary(avatarLocalPath)
      const coverImage = await uploadOnCloudinary(coverImageLocalPath)

      if(!avatar){
        throw new ApiError(400, "Avatar is required")
      }

// 6. **create user object - create entry in db**
      const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })


// 7. **remove password and refresh token field from response**
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

// 8.  **check for user creation**
        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering user")
        }

// 9.    **return response**
        // const modifiedUser = {...createdUser};
        // delete modifiedUser.circularProperty;
        return res.status(201).json(
            new ApiResponse(200, createdUser, "user Registered successfully")
        )

})

const loginUser = asyncHandler( async (req, res) => {
    //frontend se data lenge
    //check for required fields - username, email
    //check for user in database - username, email
    //check if the password is valid 
    //generate refresh and acces token
    //return cookies


// 1. **frontend se data lena hai**
        const {username, email, password} = req.body;

// 2. **check for required fields**
        if(!username && !email){
            throw new ApiError(403, "username or email is required");
        }

// 3. **check for user in database**
        const user = await User.findOne({
            $or: [{username}, {email}]
        })

        if(!user){
           throw new ApiError(404, "user not found");
        }

// 4. **check if password is valid**
        const isPasswordValid = await user.isPasswordCorrect(password);

        if(!isPasswordValid){
            throw new ApiError(404, "invalid user credentials");
        }

// 5. **generate access and refreshToken**
        const {accessToken, refreshToken} = await generateAccessRefreshToken(user._id)
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


// 6. **send cookies**
        const options = {
            httpOnly: true,
            // secure: true   //secure needs https connection but we are working on localhost
        } 

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unathorized request")
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const options = {
        httpOnly: true
    }

    const {accessToken, newrefreshToken} = await generateAccessRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newrefreshToken},
            "Access token refreshed"
        )
    )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken } 