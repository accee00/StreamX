import { Router } from "express";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJWT)

router.route("/").get(getSubscribedChannels)

router.route("/:channelId").post(toggleSubscription)

router.route("/:channelId/subscribers").get(getUserChannelSubscribers)

export default router