import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    });

    if (!comment) {
        throw new ApiError(500, "Error creating comment");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        comment,
        "Comment created successfully"
    ));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId) {
        throw new ApiError(400, "Comment id is required");
    }

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content
        },
        {
            new: true
        }
    );

    if (!updatedComment) {
        throw new ApiError(409, "Invalid comment id OR comment not exists");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        updatedComment,
        "Comment updated successfully"
    ));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "Comment id required");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(409, "Invalid comment id");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Comment deleted successfully"
    ));
});

export {
    addComment,
    updateComment,
    deleteComment
}