import express from 'express';
import { 
    saveTranscription, 
    getMeetingTranscriptions, 
    updateMeetingStatus,
    getMeetingStats,
    handleLiveKitTranscription,
    startMeetingTranscription,
    endMeetingTranscription,
    getTranscriptionStats
} from '../controllers/transcriptionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Save transcription directly (bypasses Kafka/Redis)
router.post('/save', authMiddleware, saveTranscription);

// LiveKit agent transcription endpoints
router.post('/livekit', handleLiveKitTranscription); // No auth - called by agent
router.post('/start/:meeting_id', startMeetingTranscription); // No auth - called by agent
router.post('/end/:meeting_id', authMiddleware, endMeetingTranscription);
router.get('/stats/:meeting_id', authMiddleware, getTranscriptionStats);

// Get all transcriptions for a meeting
router.get('/meeting/:meeting_id', authMiddleware, getMeetingTranscriptions);

// Update meeting status
router.put('/meeting/:meeting_id/status', authMiddleware, updateMeetingStatus);

// Get meeting statistics
router.get('/meeting/:meeting_id/stats', authMiddleware, getMeetingStats);

export default router;
