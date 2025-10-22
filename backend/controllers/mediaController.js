import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import {prisma} from "../prisma/index.js";
import { uploadToCloud } from '../services/mediaService.js';
import { bytesToMB } from '../processors/bytesToMbProcessor.js';





export const uploadMedia = catchAsyncError(async (req, res, next) => {
    const {project_id,task_id} = req.body;
    const user_id = req.user?.user_id;
    

    const file = req.file;
    if(!file){
        next(new ErrorHandler('File is required',401));
        return
    }

    const cloudRes = await uploadToCloud(file);

    const newMedia = await prisma.media.create({
        data: {
            task_id: Number(task_id),
            project_id: Number(project_id),
            file_url: cloudRes.url,
            key: cloudRes.key,
            user_id: user_id,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.buffer.length
        }
    });


    await prisma.taskProgress.create({
        data: {
            message: `Add Media filename "${file.originalname}" size ${bytesToMB(file.buffer.length)} mimetype ${file.mimetype}`,
            user_id: user_id,
            task_id: parseInt(task_id),
            type: "MEDIA"
        }
    });

    // Return the conversation ID in the response
    res.status(200).json({
        success: true,
        message:"File Upload Successfully",
        media: newMedia
    });
});


export const getMediaByProjectId = catchAsyncError(async (req, res, next) => {
    const project_id = req.params.project_id;

 
    if(!project_id){
        next(new ErrorHandler('Project Id Is Required',401));
        return
    }

   

    const media = await prisma.media.findMany({
        where: {
            project_id: Number(project_id)
        }
    });

    // Return the conversation ID in the response
    res.status(200).json({
        success: true,
        media
    });
});



export const getMediaByTaskId = catchAsyncError(async (req, res, next) => {
    const task_id = req.params.task_id;

 
    if(!task_id){
        next(new ErrorHandler('Project Id Is Required',401));
        return
    }

   

    const media = await prisma.media.findMany({
        where: {
            task_id: Number(task_id)
        }
    });

    // Return the conversation ID in the response
    res.status(200).json({
        success: true,
        media
    });
});

export const deleteMedia = catchAsyncError(async (req, res, next) => {
    const { media_id } = req.params;
    const user_id = req.user?.user_id;

    if (!media_id) {
        next(new ErrorHandler('Media ID is required', 400));
        return;
    }

    // Check if media exists and user has permission to delete it
    const media = await prisma.media.findUnique({
        where: {
            media_id: media_id
        },
        include: {
            task: {
                include: {
                    assignees: true
                }
            }
        }
    });

    if (!media) {
        next(new ErrorHandler('Media not found', 404));
        return;
    }

    // Check if user is the uploader or has access to the task
    const hasAccess = media.user_id === user_id || 
                     media.task.assignees.some(assignee => assignee.user_id === user_id);

    if (!hasAccess) {
        next(new ErrorHandler('You do not have permission to delete this media', 403));
        return;
    }

    // Delete the media record
    await prisma.media.delete({
        where: {
            media_id: media_id
        }
    });

    // Create task progress entry for the deletion
    await prisma.taskProgress.create({
        data: {
            message: `Removed attachment: "${media.filename}"`,
            user_id: user_id,
            task_id: media.task_id,
            type: "MEDIA"
        }
    });

    res.status(200).json({
        success: true,
        message: 'Media deleted successfully'
    });
});