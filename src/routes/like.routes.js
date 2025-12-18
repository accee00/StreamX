import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/videos/:videoId").patch(toggleVideoLike);

router.route("/tweets/:tweetId").patch(toggleTweetLike);

router.route("/comments/:commentId").patch(toggleCommentLike);

router.route("/videos").get(getLikedVideos);

export default router;
