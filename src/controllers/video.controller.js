import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Video } from "../models/video.model.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
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

    const videoUpload = await uploadOnCloudinary(videoLocalPath);
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
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError({
            statusCode: 400,
            message: "Video id is missing."
        })
    }

    const video = await Video.findById(videoId)
})

export { getAllVideos, publishAVideo };
