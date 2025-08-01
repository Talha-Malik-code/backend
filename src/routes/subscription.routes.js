import { Router } from "express";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannel } from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/c/:channelId")
    .get(getUserChannelSubscribers)
    .post(toggleSubscription);

router.route("/u/:subscriberId")
    .get(getSubscribedChannel);

export default router;