import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { Video } from "../models/video.model.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const sortDirection = sortType === "asc" ? 1 : -1;

    const aggregatePipeline = [];

    if (query && typeof query === "string") {
        aggregatePipeline.push({
            $match: { title: { $regex: query, $options: "i" } },
        });
    }

    aggregatePipeline.push(
        {
            $sort: { [sortBy]: sortDirection },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel",
            },
        },
        {
            $unwind: "$channel",
        },
        {
            $project: {
                _id: 1,
                thumbnail: 1,
                title: 1,
                duration: 1,
                views: {
                    $cond: {
                        if: { $isArray: "$views" },
                        then: { $size: "$views" },
                        else: { $ifNull: ["$views", 0] }
                    }
                },
                isPublished: 1,
                "channel._id": 1,
                "channel.username": 1,
                "channel.avatar": 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    );

    const paginateOptions = {
        page: pageNumber,
        limit: limitNumber,
    };

    const aggregate = Video.aggregate(aggregatePipeline);

    const result = await Video.aggregatePaginate(aggregate, paginateOptions);

    return res.status(200).json(
        new ApiResponse({
            data: result,
            statusCode: 200,
            message: "All Videos Fetched Successfully.",
        })
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError({
            statusCode: 400,
            message: "Title and description are required.",
        });
    }

    const videoLocalPath = req.files?.videoFilePath?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError({
            statusCode: 400,
            message: "Video is required.",
        });
    }

    const thumbnailLocalPath = req.files?.thumbnailImagePath?.[0]?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError({
            statusCode: 400,
            message: "Thumbnail is required.",
        });
    }

    const videoUpload = await uploadOnCloudinary(videoLocalPath, true);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoUpload || !thumbnailUpload) {
        throw new ApiError({
            statusCode: 400,
            message: "Upload on cloudinary failed.",
        });
    }

    const video = await Video.create({
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        owner: req.user._id,
        title,
        description,
        duration: videoUpload.duration,
    });

    return res.status(201).json(
        new ApiResponse({
            statusCode: 201,
            message: "Video is published.",
            data: video,
        })
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError({
            statusCode: 400,
            message: "Video id is missing.",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid video id.",
        });
    }

    const userId = req.user?._id;

    const pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(String(videoId)),
            },
        },
        {
            $limit: 1
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channelOwner",
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $unwind: "$channelOwner",
        },
        {
            $addFields: {
                likesCount: { $size: { $ifNull: ["$likes", []] } },
                comments: { $ifNull: ["$comments", []] },
                "channelOwner.subscriberCount": {
                    $size: { $ifNull: ["$subscribers", []] },
                },
                "channelOwner.isSubscribed": userId
                    ? {
                        $cond: [
                            {
                                $in: [
                                    userId,
                                    { $ifNull: ["$subscribers.subscriber", []] },
                                ],
                            },
                            true,
                            false,
                        ],
                    }
                    : false,
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                videoFile: 1,
                thumbnail: 1,
                likesCount: 1,
                comments: 1,
                "channelOwner._id": 1,
                "channelOwner.avatar": 1,
                "channelOwner.fullName": 1,
                "channelOwner.username": 1,
                "channelOwner.subscriberCount": 1,
                "channelOwner.isSubscribed": 1,
            },
        },
    ];

    const [video] = await Video.aggregate(pipeline);

    if (!video) {
        throw new ApiError({
            statusCode: 404,
            message: "Video not found.",
        });
    }
    await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Get video data success.",
            data: video,
        })
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!videoId) {
        throw new ApiError({
            statusCode: 400,
            message: "Video id is required."
        });
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid video id."
        });
    }

    let thumbnailUrl;
    if (req.file?.path) {
        thumbnailUrl = await uploadOnCloudinary(req.file.path);
        const oldThumbnailUrl = await Video.findById(videoId)
        await deleteOnCloudinary(oldThumbnailUrl.thumbnail)
    }

    const updateFields = {};

    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (thumbnailUrl) updateFields.thumbnail = thumbnailUrl.url;

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Video updated successfully.",
            data: updatedVideo
        })
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError({
            statusCode: 400,
            message: "Video id is missing.",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError({
            statusCode: 400,
            message: "Invalid video id.",
        });
    }
    /// delete thumbnail and video from cloudinary too.
    const video = await Video.findById(videoId)

    await deleteOnCloudinary(video.thumbnail)

    await deleteOnCloudinary(video.videoFile, true)

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Video deleted success.",
            data: deleteVideo,
        })
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError({ statusCode: 400, message: "Video id is missing." });
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid video id." });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        [
            {
                $set: {
                    isPublished: { $not: "$isPublished" }
                }
            }
        ],
        { new: true }
    );


    if (!updatedVideo) {
        throw new ApiError({ statusCode: 404, message: "Video not found." });
    }

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Publish status toggled successfully.",
            data: updatedVideo,
        })
    );
});

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus };
