import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


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
    console.log("email:",email);


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
    const existedUser = User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists");
    }

// 4. **check for images , check for avatar **
     //multer hume directly req.files ka access de deta hai,
     //jaise express hume req.body ka access de deta hai
     const avatarLocalPath = req.files?.avatar[0]?.path;
     const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

        const createdUser = User.findById(user._id).select(
            "-password -refreshToken"
        )

        if(createdUser){
            throw new ApiError(500, "Something went wrong while registering user")
        }

        return res.status(201).json(
            new ApiResponse200, createdUser, "user Registered successfully"
        )

})

export { registerUser } 