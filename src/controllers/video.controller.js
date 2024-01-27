import { asyncHandler } from "../utlis/asyncHandler.js";
import { Video } from "../modles/video.models.js";
import { ApiError } from "../utlis/ApiError.js";
import { uploadOnCloud } from "../utlis/Cloudinary.js";
import { ApiResponse } from "../utlis/ApiResponse.js";

const getAllVideos = asyncHandler(async (req, res) => {

})

const publishAVideo = asyncHandler(async (req, res) => {
    const {title, description} = req.body

    const videoFileLocalPath = req.files?.videoFile[0]?.path

    if(!videoFileLocalPath) {
        throw new ApiError(400, "Video file not found")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail file not found")
    }

    const videoFile = await uploadOnCloud(videoFileLocalPath)
    const thumbnail = await uploadOnCloud(thumbnailLocalPath)

    if (!videoFile) {
    throw new ApiError(400, "Video file not found");
    }


    if (!thumbnail) {
    throw new ApiError(400, "Thumbnail file not found");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration,
        owner: req.user?._id
    })

    console.log(videoFile);

    if(!video){
        throw new ApiError(500, "Something went wrong while creating video");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            video,
            "Video uploaded successfully"
        )
    )


})

export {
    getAllVideos,
    publishAVideo
}