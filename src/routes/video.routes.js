import { Router } from "express";
import { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/get-videos").get(getAllVideos)

router.route("/publish-video").post(
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
router.route("/video/update-video/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo)

router
    .route("/video/:videoId")
    .get(verifyJWT, getVideoById)
    .delete(verifyJWT, deleteVideo);

router
    .route("/video/:videoId/publish")
    .patch(verifyJWT, togglePublishStatus);

export default router