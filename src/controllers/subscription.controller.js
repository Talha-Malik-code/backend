import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "Channel id is required");
    }

    const subscriptionExists = await Subscription.findOneAndDelete({
        subscriber: req.user?._id,
        channel: channelId
    });

    let newSubscription;

    if (!subscriptionExists) {
        newSubscription = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        });
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        subscriptionExists ? {} : newSubscription,
        `${subscriptionExists ? "Unsubscribed" : "Subscribed"} successfully`
    ));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "Channel id is required");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscribers: {
                    $first: "$subscribers"
                }
            }
        },
        {
            $project: {
                subscribers: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        subscribers,
        "Subscribers fetched successfully"
    ))
});

const getSubscribedChannel = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!subscriberId) {
        throw new ApiError(400, "Subscriber id is required");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscribedChannels: {
                    $first: "$subscribedChannels"
                }
            }
        },
        {
            $project: {
                subscribedChannels: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channel fetched successfully"
    ));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannel
}