import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        throw new ApiError(400, "Name is required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    });

    if (!playlist) {
        throw new ApiError(500, "Error occured while creating playlist");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Playlist created successfully"
    ));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "Invalid user id");
    }

    const playlists = await Playlist.find({
        owner: userId
    }).populate({
        path: "videos",
        populate: { path: "owner", select: "username fullName avatar" }
    })

    if (!playlists.length) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlists,
        "User Playlists fetched successfully"
    ));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid playlist id");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) }
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
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
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
                        $unwind: "$owner"
                    }
                ]
            }
        }
    ]);

    if (!playlist.length) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Playlist fetched successfully"
    ));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) && !isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid playlist or video id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unaouthorized request");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(401, "Video is already in the playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Video added successfully"
    ));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) && !isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid playlist or video id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unaouthorized request");
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(401, "Video is not in the playlist");
    }

    playlist.videos = playlist.videos.filter(vidId => vidId.toString() !== videoId);
    await playlist.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Video removed from playlist successfully"
    ));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unaouthorized request");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Playlist deleted successfully"
    ));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid playlist id");
    }

    if (!name && !description) {
        throw new ApiError(400, "Name or description is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unaouthorized request");
    }

    if (name) playlist.name = name;
    if (description) playlist.description = description;

    await playlist.save({validateBeforeSave: false});
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Playlist updated successfully"
    ));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}