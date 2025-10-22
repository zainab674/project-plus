import express from "express";
import {authMiddleware} from '../middlewares/authMiddleware.js'
import singleUpload from "../middlewares/multerMiddleware.js";
import { getMediaByProjectId, getMediaByTaskId, uploadMedia, deleteMedia } from "../controllers/mediaController.js";


const router = express.Router();

router.route('/upload').post(authMiddleware,singleUpload,uploadMedia);
router.route('/project/:project_id').get(authMiddleware,getMediaByProjectId);
router.route('/task/:task_id').get(authMiddleware,getMediaByTaskId);
router.route('/delete/:media_id').delete(authMiddleware,deleteMedia);

export default router;
