import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler"
import { ApiError } from "../utils/ApiError.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    const userId = req.user?._id

    if (!channelId) {
        throw new ApiError({
            statusCode: 400,
            message: "Channel id is required."
        })
    }
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid channel id",
        });
    }
    if (channelId === userId.toString()) {
        throw new ApiError({
            statusCode: 400,
            message: "You cannot subscribe to your own channel",
        });
    }

    /// check if channel is already subscribed.
    const isSubscribed = await Subscription.findOne({
        subscriber: userId,
        channelId: channelId
    })

    if (!isSubscribed) {
        const subscribed = await Subscription.create({
            subscriber: userId,
            channelId: channelId,
        })
        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                data: subscribed,
                message: "Channel subscribed successfully."
            })
        )
    } else {
        await isSubscribed.deleteOne({ _id: isSubscribed._id })
        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                data: null,
                message: "Channel unsubscribed successfully."
            })
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId) {
        throw new ApiError({
            statusCode: 400,
            message: "Channel id is required."
        })
    }
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid channel id",
        })
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(String(channelId)),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 1,
                subscriber: 1,
                channel: 1,
                username: "$user.username",
                avatar: "$user.avatar",
            },
        },
    ])
    res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            data: subscribers,
            message: "Subscribers fetched successfully."
        })
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user._id

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
            },
        },
        { $unwind: "$channel" },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 1,
                channelId: "$channel._id",
                username: "$channel.username",
                avatar: "$channel.avatar",
                fullName: "$channel.fullName",
            },
        },
    ])

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            data: subscribedChannels,
            message: "Subscribed channels fetched successfully",
        })
    )
})


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}