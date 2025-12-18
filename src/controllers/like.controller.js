import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError({
            statusCode: 400,
            message: "Video id is required."
        })
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid video id.",
        });
    }

    const isLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if (!isLiked) {
        const like = await Like.create({
            video: videoId,
            likedBy: req.user?._id,
        })
        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                message: "Video liked successfully.",
                data: like,
            })
        )
    } else {
        await isLiked.deleteOne()
        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                message: "Video unliked successfully.",
                data: null
            })
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!commentId) {
        throw new ApiError({
            statusCode: 400,
            message: "Comment id is required."
        })
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid comment id."
        })
    }

    const isLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (!isLiked) {
        const like = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })

        return res.send(200).json(
            new ApiResponse({
                statusCode: 200,
                message: "Comment liked successfully.",
                data: like
            })
        )
    } else {
        await isLiked.deleteOne()
        return res.send(200).json(
            new ApiResponse({
                statusCode: 200,
                message: "Comment unliked successfully.",
                data: null,
            })
        )
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!tweetId) {
        throw new ApiError({
            statusCode: 400,
            message: "Tweet id is required."
        })
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid tweet id."
        })
    }

    const isLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if (!isLiked) {
        const like = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })
        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                message: "Tweet liked successfully.",
                data: like,
            })
        )
    } else {
        await isLiked.deleteOne()
        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                message: "Tweet unliked successfully.",
                data: null,
            })
        )
    }
})
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const pipeline = [
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos"
            }
        },
        { $unwind: "$likedVideos" },
        {
            $lookup: {
                from: "users",
                localField: "likedVideos.owner",
                foreignField: "_id",
                as: "channel"
            }
        },
        { $unwind: "$channel" },
        {
            $project: {
                likedVideos: 1,
                channel: {
                    fullName: 1,
                    avatar: 1,
                    username: 1
                }
            }
        }
    ];

    const likedVideos = await Like.aggregate(pipeline);

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Liked videos fetched successfully.",
            data: likedVideos
        })
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}