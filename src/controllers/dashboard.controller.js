import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(String(channelId))
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$videoLikes" }
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: "$likesCount" }
            }
        }
    ]);

    // 2️⃣ Subscribers count
    const totalSubscribers = await mongoose
        .model("Subscription")
        .countDocuments({ channel: channelId });

    const data = {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: videoStats[0]?.totalLikes || 0,
        totalSubscribers
    };

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Get channel stats success.",
            data
        })
    );
});


const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user._id
    const { page = 1, limit = 10 } = req.query

    const pageNumber = Number(page)
    const limitNumber = Number(limit)

    const aggregate = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(String(channelId)),
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    const result = await Video.aggregatePaginate(aggregate, {
        page: pageNumber,
        limit: limitNumber
    })

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Get channel video success.",
            data: result
        })
    )
})

export {
    getChannelStats,
    getChannelVideos
}