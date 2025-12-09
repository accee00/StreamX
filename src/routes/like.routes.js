import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.patch("/videos/:videoId/like", toggleVideoLike);

router.patch("/tweets/:tweetId/like", toggleTweetLike);

router.patch("/comments/:commentId/like", toggleCommentLike);

router.get("/videos", getLikedVideos);

export default router;
