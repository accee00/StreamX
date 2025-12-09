import { Router } from "express";
import { getAllVideos, publishAVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/getVideos').get(getAllVideos)

router.route('/publishVideo').post(
    verifyJWT,
    upload.fields([
        {
            name: "videoFilePath", maxCount: 1

        },
        {
            name: "thumbnailImagePath", maxCount: 1
        }
    ]),
    publishAVideo,
)

export default router