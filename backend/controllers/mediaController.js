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