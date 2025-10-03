import express from "express";
import {authMiddleware} from '../middlewares/authMiddleware.js'
import {getAllDocuments,requestDocument,updateDocument,updateStatus,getUpdates,giveUpdates, getOverview, getInDateRange, getAllBilling, createBill, updateBillingStatus, getPendingDocs, getPendingsDocsByProjectId, getAllFiled, createFiled, updateFiledStatus, getAllSign, createSign, uploadSign, updateSignStatus, getClientHistory, getAllClientDocuments, getClientProjects} from "../controllers/clientController.js";
import singleUpload from "../middlewares/multerMiddleware.js";

const router = express.Router();
router.route('/get-all/:project_client_id').get(authMiddleware,getAllDocuments);
router.route('/request').post(authMiddleware,requestDocument);
router.route('/upload/').post(authMiddleware,singleUpload,updateDocument);
router.route('/status/').post(authMiddleware,updateStatus);


router.route('/get-all-billing/:project_client_id').get(authMiddleware,getAllBilling);
router.route('/create-billing').post(authMiddleware,createBill);
router.route('/status-billing/').post(authMiddleware,updateBillingStatus);


router.route('/get-all-filed/:project_client_id').get(authMiddleware ,getAllFiled);
router.route('/create-filed').post(authMiddleware,singleUpload,createFiled);
router.route('/status-filed/').post(authMiddleware,updateFiledStatus);


router.route('/get-all-signed/:project_client_id').get(authMiddleware ,getAllSign);
router.route('/create-signed').post(authMiddleware,singleUpload,createSign);
router.route('/status-signed/').post(authMiddleware,updateSignStatus);
router.route('/upload-signed/').post(authMiddleware,singleUpload,uploadSign);


router.route('/get-updates/:project_client_id').get(authMiddleware,getUpdates);
router.route('/give-update/').post(authMiddleware,singleUpload,giveUpdates);

router.route('/get-overview/').get(authMiddleware,getOverview);
router.route('/get-by-date-range/:project_client_id').get(authMiddleware,getInDateRange);


router.route('/get-peding-documents').get(authMiddleware,getPendingDocs);
router.route('/get-peding-documents/:project_id').get(authMiddleware,getPendingsDocsByProjectId);


router.route('/history/:project_client_id').get(authMiddleware, getClientHistory);


router.route('/client-document/:project_client_id').get(authMiddleware, getAllClientDocuments);
router.route('/my-projects').get(authMiddleware, getClientProjects);


export default router;