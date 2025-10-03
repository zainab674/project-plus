import axios from 'axios';

class LiveKitWebhookService {
    constructor() {
        this.backendUrl = process.env.BACKEND_URL || 'http://localhost:8978';
        this.apiKey = process.env.LIVEKIT_WEBHOOK_API_KEY || 'your-webhook-api-key';
    }

    /**
     * Send transcription data to backend
     * @param {string} meetingId - The meeting ID
     * @param {Object} transcriptionData - Transcription data from LiveKit agent
     */
    async sendTranscription(meetingId, transcriptionData) {
        try {
            const response = await axios.post(`${this.backendUrl}/api/v1/transcription/livekit`, {
                meeting_id: meetingId,
                transcription_data: transcriptionData
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                timeout: 5000 // 5 second timeout
            });

            if (response.data.success) {
                console.log(`✅ Transcription sent to backend for meeting ${meetingId}`);
                return true;
            } else {
                console.error(`❌ Backend rejected transcription for meeting ${meetingId}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error sending transcription to backend:`, error.message);
            return false;
        }
    }

    /**
     * Notify backend that meeting has started
     * @param {string} meetingId - The meeting ID
     */
    async notifyMeetingStarted(meetingId) {
        try {
            const response = await axios.post(`${this.backendUrl}/api/transcription/start/${meetingId}`, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                timeout: 5000
            });

            if (response.data.success) {
                console.log(`✅ Meeting start notification sent for meeting ${meetingId}`);
                return true;
            } else {
                console.error(`❌ Backend rejected meeting start notification for meeting ${meetingId}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error sending meeting start notification:`, error.message);
            return false;
        }
    }

    /**
     * Notify backend that meeting has ended
     * @param {string} meetingId - The meeting ID
     * @param {number} userId - User ID who ended the meeting
     */
    async notifyMeetingEnded(meetingId, userId) {
        try {
            const response = await axios.post(`${this.backendUrl}/api/transcription/end/${meetingId}`, {
                user_id: userId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                timeout: 10000 // Longer timeout for processing
            });

            if (response.data.success) {
                console.log(`✅ Meeting end notification sent for meeting ${meetingId}`);
                return response.data;
            } else {
                console.error(`❌ Backend rejected meeting end notification for meeting ${meetingId}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error sending meeting end notification:`, error.message);
            return false;
        }
    }

    /**
     * Get transcription statistics from backend
     * @param {string} meetingId - The meeting ID
     */
    async getTranscriptionStats(meetingId) {
        try {
            const response = await axios.get(`${this.backendUrl}/api/transcription/stats/${meetingId}`, {
                headers: {
                    'X-API-Key': this.apiKey
                },
                timeout: 5000
            });

            if (response.data.success) {
                return response.data;
            } else {
                console.error(`❌ Backend rejected stats request for meeting ${meetingId}`);
                return null;
            }
        } catch (error) {
            console.error(`❌ Error getting transcription stats:`, error.message);
            return null;
        }
    }
}

export default new LiveKitWebhookService();
