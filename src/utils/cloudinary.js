import { v2 as cloudinary } from "cloudinary"
import fs from 'fs'
import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
})


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) return null

        /// upload file
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        })

        console.log(`File uploaded on cloudinary: ${response.url}`)
        return response
    } catch (e) {
        console.log(`Cloudinary Error ${e}`)
        fs.unlinkSync(filePath)
        return null
    }
}

function getPublicIdFromUrl(url) {
    if (!url) return null;

    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}
const deleteOnCloudinary = async (publicIdOrUrl, isVideo = false) => {
    try {
        if (!publicIdOrUrl) return null;

        const publicId = getPublicIdFromUrl(publicIdOrUrl);

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: isVideo ? "video" : "image",
        });

        if (response.result === "ok") {
            console.log("Deleted successfully");
            return true;
        } else {
            console.log("Delete failed or file not found:", response.result);
            return false;
        }
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteOnCloudinary }