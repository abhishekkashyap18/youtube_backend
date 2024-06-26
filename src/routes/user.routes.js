import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import  { verifyJWT }   from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",  //frontend me bhi field ka name same hona chaiye
            maxCount: 1
        },
        {
            name: "coverImage", //frontend me bhi field ka name same hona chaiye
            maxCount: 1
        }
    ]),
    registerUser
    )


router.route("/login").post(loginUser)

//secure routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
export default router;