import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }

    const likeExists = await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user?._id
    });

    let newLike;

    if (!likeExists) {
        newLike = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        likeExists ? {} : newLike,
        `Video ${likeExists ? "Unliked" : "Liked"} successfully`
    ));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "Comment id is required");
    }

    const likeExists = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: req.user?._id
    });

    let newLike;

    if (!likeExists) {
        newLike = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        likeExists ? {} : newLike,
        `Comment ${likeExists ? "Unliked" : "Liked"} successfully`
    ));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(400, "Tweet id is required");
    }

    const likeExists = await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: req.user?._id
    });

    let newLike;

    if (!likeExists) {
        newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        likeExists ? {} : newLike,
        `Tweet ${likeExists ? "Unliked" : "Liked"} successfully`
    ));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
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
                ]
            }
        },
        {
            $project: {
                likedVideos: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        likedVideos,
        "Fetched liked videos successfully"
    ))
});


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}