import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Tweet } from "../models/tweet.model.js"


const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
        throw new ApiError({
            statusCode: 400,
            message: "Content cannot be empty",
        });
    }

    const tweet = await Tweet.create({
        owner: userId,
        content: content.trim(),
    });

    return res.status(201).json(
        new ApiResponse({
            statusCode: 201,
            message: "Tweet created successfully.",
            data: tweet,
        })
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid user id",
        });
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(String(userId)),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                username: "$user.username",
                avatar: "$user.avatar",
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            data: tweets,
            message: "User tweets fetched successfully",
        })
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId, content } = req.body;
    const userId = req.user._id;

    if (!tweetId) {
        throw new ApiError({
            statusCode: 400,
            message: "Tweet id is required.",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid tweet id.",
        });
    }


    if (!content || !content.trim()) {
        throw new ApiError({
            statusCode: 400,
            message: "Content cannot be empty.",
        });
    }
    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: userId,
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

    if (!updatedTweet) {
        throw new ApiError({
            statusCode: 404,
            message: "Tweet not found or you are not authorized to update it.",
        });
    }

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Tweet updated successfully.",
            data: updatedTweet,
        })
    );
});


const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;

    if (!tweetId) {
        throw new ApiError({
            statusCode: 400,
            message: "Tweet id is required.",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid tweet id.",
        });
    }


    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: userId,
    });

    if (!deletedTweet) {
        throw new ApiError({
            statusCode: 404,
            message: "Tweet not found or you are not authorized to delete it.",
        });
    }

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Tweet deleted successfully.",
            data: null,
        })
    );
});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}