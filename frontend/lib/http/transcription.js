import { api } from './index.js';

// Get meeting transcriptions
export const getMeetingTranscriptionsRequest = async (meetingId) => {
    try {
        const response = await api.get(`/transcription/meeting/${meetingId}`);
        return response;
    } catch (error) {
        console.error('Error fetching meeting transcriptions:', error);
        throw error;
    }
};

// Save transcription (if needed for future use)
export const saveTranscriptionRequest = async (transcriptionData) => {
    try {
        const response = await api.post('/transcription/save', transcriptionData);
        return response;
    } catch (error) {
        console.error('Error saving transcription:', error);
        throw error;
    }
};

// Update meeting status (if needed for future use)
export const updateMeetingStatusRequest = async (meetingId, statusData) => {
    try {
        const response = await api.put(`/transcription/meeting/${meetingId}/status`, statusData);
        return response;
    } catch (error) {
        console.error('Error updating meeting status:', error);
        throw error;
    }
};

// Get meeting statistics (if needed for future use)
export const getMeetingStatsRequest = async (meetingId) => {
    try {
        const response = await api.get(`/transcription/meeting/${meetingId}/stats`);
        return response;
    } catch (error) {
        console.error('Error fetching meeting stats:', error);
        throw error;
    }
};
