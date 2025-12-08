import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc" } = req.query;
    const pageNumber = parseInt(page)
    const limitNumber = parseInt(limit)

    const sortDirection = sortType === "asc" ? 1 : -1

    const aggregatePipeline = [
        {
            /// search by query.
            $match: { title: { $regex: query, $options: "i" } }
        },
        {
            /// sort data
            $sort: { [sortBy]: sortDirection }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel"
            }
        },
        {
            /// break array into separate doc.
            $unwind: "$channel"
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
    ]
    const paginateOptions = {
        page: pageNumber,
        limit: limitNumber,
    }

    /// runs the pipeline.
    const aggregate = Video.aggregate(aggregatePipeline);

    Video.aggregatePaginate(aggregate, paginateOptions, (err, result) => {
        if (err) {
            throw new ApiError({
                statusCode: 400,
                message: err.message,
            })
        } else {
            return res.status(200).json(
                new ApiResponse({
                    data: result,
                    statusCode: 200,
                    message: "All Videos Fetched Successfully."
                })
            );
        }
    })
})

export { getAllVideos };