import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(401, "Invalid channel id");
    }

    const channel = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes"
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalSubscribers: {
                    $size: "$subscribers"
                },
                totalVideos: {
                    $size: "$videos"
                },
                totalLikes: {
                    $size: "$videos.likes"
                }
            }
        },
        {
            $project: {
                password: 0,
                refreshToken: 0,
                subscribers: 0,
                videos: 0
            }
        }
    ]);

    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        channel,
        "Channel stats fetched successfully"
    ));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(401, "Invalid channel id");
    }

    // const channelVideos = await User.aggregate([
    //     {
    //         $match: {
    //             _id: new mongoose.Types.ObjectId(channelId)
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "videos",
    //             localField: "_id",
    //             foreignField: "owner",
    //             as: "videos",
    //             pipeline: [
    //                 {
    //                     $lookup: {
    //                         from: "users",
    //                         localField: "owner",
    //                         foreignField: "_id",
    //                         as: "owner"
    //                     }
    //                 },
    //                 {
    //                     $project: {
    //                         fullName: 1,
    //                         username: 1,
    //                         avatar: 1
    //                     }
    //                 }
    //             ]
    //         }
    //     },
    //     {
    //         $replaceRoot: { newRoot: "$videos" }
    //     }
    // ]);

    const channelVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: {
                    $first: "$owner"
                }
            }
        }
    ]);

    if (!channelVideos) {
        throw new ApiError(404, "Channel or Videos not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        channelVideos,
        "Videos fetched sucessfully"
    ));
});

export {
    getChannelStats,
    getChannelVideos
}