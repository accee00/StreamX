import { Tweet } from "../models/tweet.model.js"
import { Video } from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

})

const addComment = asyncHandler(async (req, res) => {
    /*
    We have tweets and I'm adding comments there so we can either comment on tweets or videos right?
    1. Work either with tweet or video.
    2. Extract comment, video or tweet Id, type of Comment from body.
    3. Type of Comment: Video Or Tweet.
    */
    const { content, videoOrTweetId, typeOf } = req.body;

    if (!content || !content.trim()) {
        throw new ApiError({
            statusCode: 400,
            message: "Comment content is required.",
        });
    }

    if (!videoOrTweetId) {
        throw new ApiError({
            statusCode: 400,
            message: "Video Or Tweet id is required.",
        });
    }
    if (!["Video", "Tweet"].includes(typeOf)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid types. It's either Video Or Tweet",
        });
    }

    const Model = typeOf === "Video" ? Video : Tweet;
    /// Additional check that prevent us from 
    const target = await Model.findById(videoOrTweetId)

    if (!target) {
        throw new ApiError({
            statusCode: 404,
            message: `${typeOf} not found.`,
        });
    }

    const comment = await Comment.create({
        content: content,
        owner: req.user?._id,
        targetModel: typeOf,/// video or tweet.
        target: videoOrTweetId, /// video or tweet id.
    })

    return res.status(201).json(new ApiResponse({
        statusCode: 201,
        message: "Comment added successfully.",
        data: comment,
    }))

})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId) {
        throw new ApiError({
            statusCode: 400,
            message: "Comment id is required.",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid comment id.",
        });
    }

    if (!content || !content.trim()) {
        throw new ApiError({
            statusCode: 400,
            message: "Comment content is required.",
        });
    }

    const updatedComment = await Comment.findOneAndUpdate(
        {
            _id: commentId,
            owner: req.user._id,
        },
        {
            $set: {
                content: content.trim(),
            },
        },
        {
            new: true,
        }
    );

    if (!updatedComment) {
        throw new ApiError({
            statusCode: 404,
            message: "Comment not found or not authorized.",
        });
    }

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Comment updated successfully.",
            data: updatedComment,
        })
    );
});


const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError({
            statusCode: 400,
            message: "Comment id is required.",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid comment id.",
        });
    }

    const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id,
    });

    if (!deletedComment) {
        throw new ApiError({
            statusCode: 404,
            message: "Comment not found or not authorized.",
        });
    }

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Comment deleted successfully.",
            data: deletedComment,
        })
    );
});


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}