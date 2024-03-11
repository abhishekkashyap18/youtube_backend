import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

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

export default router;