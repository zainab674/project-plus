import express from "express";
import {authMiddleware} from '../middlewares/authMiddleware.js'
import { createClientMeeting, createMeeting, getMeetingBYId, getMeetings, handleConfirm, handleVoting, updateMeetingStatus, deleteMeeting, generateLiveKitToken, dispatchAgentToMeeting, checkAgentDispatchStatus, endMeeting, startMeetingTranscription } from "../controllers/meetingController.js";


const router = express.Router();

router.route('/create').post(authMiddleware,createMeeting);
router.route('/create/client').post(authMiddleware,createClientMeeting);
router.route('/vote/:meeting_id').get(handleVoting);
router.route('/confirm/:meeting_id').get(handleConfirm);
router.route('/get').get(authMiddleware,getMeetings);
router.route('/get/:meeting_id').get(authMiddleware,getMeetingBYId);

router.route('/status/:meeting_id').put(authMiddleware,updateMeetingStatus);
router.route('/:meeting_id').delete(authMiddleware,deleteMeeting);

// LiveKit token generation route
router.route('/token/:meeting_id').get(authMiddleware, generateLiveKitToken);

// Agent dispatch routes
router.route('/dispatch/:meeting_id').post(authMiddleware, dispatchAgentToMeeting);
router.route('/dispatch-status/:meeting_id').get(authMiddleware, checkAgentDispatchStatus);

// Meeting transcription routes
router.route('/start-transcription/:meeting_id').post(authMiddleware, startMeetingTranscription);
router.route('/end/:meeting_id').post(authMiddleware, endMeeting);

export default router;
