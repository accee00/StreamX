import { Router } from "express";
import {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments,
    getTweetComments,
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(addComment);
router.route("/v/:videoId").get(getVideoComments);
router.route("/t/:tweetId").get(getTweetComments);
router.route("/:commentId").patch(updateComment).delete(deleteComment);

export default router;
