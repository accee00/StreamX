import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import mongoose, { isValidObjectId } from "mongoose"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError({
            statusCode: 422,
            message: "Name and description are required."
        })
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse({
            statusCode: 201,
            message: "Playlist created successfully.",
            data: playlist
        })
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError({
            statusCode: 422,
            message: "Invalid user id."
        })
    }

    const playlists = await Playlist.find({ owner: userId })
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Playlists fetched successfully.",
            data: playlists
        })
    )
})
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError({
            statusCode: 422,
            message: "Invalid playlist id."
        })
    }

    const playlist = await Playlist.findOne({
        _id: playlistId,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError({
            statusCode: 404,
            message: "Playlist not found."
        })
    }

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Playlist fetched successfully.",
            data: playlist
        })
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError({
            statusCode: 422,
            message: "Invalid playlistId or videoId."
        })
    }

    const videoExists = await Video.exists({ _id: videoId })

    if (!videoExists) {
        throw new ApiError({
            statusCode: 404,
            message: "Video not found."
        })
    }

    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $addToSet: { videos: videoId }
        },
        { new: true }
    ).populate("videos", "title thumbnail duration videoFile owner")

    if (!playlist) {
        throw new ApiError({
            statusCode: 404,
            message: "Playlist not found or access denied."
        })
    }
    /// agr playlist mai bhaut video hai jo ki production mai hoga hi toh pagination lga do videos pe.
    /// paginate ki jgh.
    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Video added to playlist successfully.",
            data: playlist
        })
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError({
            statusCode: 422,
            message: "Invalid playlistId or videoId."
        })
    }

    const videoExists = await Video.exists({ _id: videoId })
    if (!videoExists) {
        throw new ApiError({
            statusCode: 404,
            message: "Video not found."
        })
    }

    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $pull: { videos: videoId }
        },
        { new: true }
    )

    if (!playlist) {
        throw new ApiError({
            statusCode: 404,
            message: "Playlist not found or access denied."
        })
    }

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Video removed from playlist successfully.",
            data: playlist
        })
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError({
            statusCode: 422,
            message: "Invalid playlist id."
        })
    }

    const playlist = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError({
            statusCode: 404,
            message: "Playlist not found or access denied."
        })
    }

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Playlist deleted successfully.",
            data: null
        })
    )
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError({
            statusCode: 422,
            message: "Invalid playlist id."
        })
    }

    if (!name?.trim() && !description?.trim()) {
        throw new ApiError({
            statusCode: 422,
            message: "At least one field (name or description) is required."
        })
    }

    const updateData = {}
    if (name?.trim()) updateData.name = name.trim()
    if (description?.trim()) updateData.description = description.trim()

    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $set: updateData
        },
        { new: true }
    )

    if (!playlist) {
        throw new ApiError({
            statusCode: 404,
            message: "Playlist not found or access denied."
        })
    }

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            message: "Playlist updated successfully.",
            data: playlist
        })
    )
})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}