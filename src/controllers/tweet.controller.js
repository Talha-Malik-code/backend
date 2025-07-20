import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.create({
        owner: req.user?._id,
        content
    });

    if (!tweet) {
        throw new ApiError(500, "Error creating tweet");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweet,
        "Tweet created successfully"
    ));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
            $unwind: "$owner"
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ]);

    if (!tweets.length) {
        throw new ApiError(500, "No tweet found");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweets,
        "User Tweets fetched successfully"
    ));
});

const updateTweet = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(401, "Invalid tweet id");
    }

    if (!content) {
        throw new ApiError(400, "Conetnt is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized request");
    }

    tweet.content = content;
    await tweet.save({validateBeforeUpdate: true});

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweet,
        "Tweet Updated successfully"
    ));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { tweetId } = req.params;
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(401, "Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized request");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Tweet deleted successfully"
    ));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}