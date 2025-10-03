import { prisma } from '../prisma/index.js';

class TranscriptionCollectionService {
    constructor() {
        this.transcriptions = new Map(); // meeting_id -> array of transcriptions
        this.meetingStartTimes = new Map(); // meeting_id -> start time
        this.meetingEndTimes = new Map(); // meeting_id -> end time
    }

    /**
     * Add a transcription segment to the collection
     * @param {string} meetingId - The meeting ID
     * @param {Object} transcriptionData - Transcription data from LiveKit agent
     */
    addTranscription(meetingId, transcriptionData) {
        if (!this.transcriptions.has(meetingId)) {
            this.transcriptions.set(meetingId, []);
        }

        const transcription = {
            type: transcriptionData.type, // 'interim' or 'final'
            text: transcriptionData.text,
            participant: transcriptionData.participant,
            trackSid: transcriptionData.trackSid,
            segmentId: transcriptionData.segmentId,
            timestamp: new Date(),
            processed: false
        };

        this.transcriptions.get(meetingId).push(transcription);
        console.log(`📝 Added ${transcription.type} transcription for meeting ${meetingId}: ${transcription.text.substring(0, 50)}...`);
    }

    /**
     * Mark meeting as started
     * @param {string} meetingId - The meeting ID
     */
    startMeeting(meetingId) {
        this.meetingStartTimes.set(meetingId, new Date());
        console.log(`🎬 Meeting ${meetingId} started at ${new Date().toISOString()}`);
    }

    /**
     * Mark meeting as ended and process transcriptions
     * @param {string} meetingId - The meeting ID
     * @param {number} userId - User ID who ended the meeting
     */
    async endMeeting(meetingId, userId) {
        this.meetingEndTimes.set(meetingId, new Date());
        console.log(`🏁 Meeting ${meetingId} ended at ${new Date().toISOString()}`);

        // Process and save transcriptions
        await this.processAndSaveTranscriptions(meetingId, userId);
    }

    /**
     * Process transcriptions and save to database
     * @param {string} meetingId - The meeting ID
     * @param {number} userId - User ID
     */
    async processAndSaveTranscriptions(meetingId, userId) {
        try {
            const meetingTranscriptions = this.transcriptions.get(meetingId) || [];
            
            if (meetingTranscriptions.length === 0) {
                console.log(`📝 No transcriptions found for meeting ${meetingId}`);
                return;
            }

            console.log(`📝 Processing ${meetingTranscriptions.length} transcription segments for meeting ${meetingId}`);

            // Group transcriptions by participant and create final transcripts
            const participantTranscripts = this.groupTranscriptionsByParticipant(meetingTranscriptions);

            // Save each participant's transcript
            for (const [participant, transcript] of participantTranscripts.entries()) {
                if (transcript.finalText.trim()) {
                    await this.saveTranscriptionToDatabase(meetingId, userId, participant, transcript);
                }
            }

            // Update meeting status and duration
            await this.updateMeetingStatus(meetingId);

            // Clear transcriptions from memory
            this.transcriptions.delete(meetingId);
            this.meetingStartTimes.delete(meetingId);
            this.meetingEndTimes.delete(meetingId);

            console.log(`✅ Successfully processed and saved transcriptions for meeting ${meetingId}`);

        } catch (error) {
            console.error(`❌ Error processing transcriptions for meeting ${meetingId}:`, error);
            throw error;
        }
    }

    /**
     * Group transcriptions by participant and create final transcripts
     * @param {Array} transcriptions - Array of transcription objects
     * @returns {Map} Map of participant -> final transcript
     */
    groupTranscriptionsByParticipant(transcriptions) {
        const participantMap = new Map();

        // Sort transcriptions by timestamp
        const sortedTranscriptions = transcriptions.sort((a, b) => a.timestamp - b.timestamp);

        for (const transcription of sortedTranscriptions) {
            const participant = transcription.participant;
            
            if (!participantMap.has(participant)) {
                participantMap.set(participant, {
                    segments: [],
                    finalText: '',
                    startTime: transcription.timestamp,
                    endTime: transcription.timestamp
                });
            }

            const participantData = participantMap.get(participant);
            
            // Only add final transcriptions to avoid duplicates
            if (transcription.type === 'final') {
                participantData.segments.push({
                    text: transcription.text,
                    timestamp: transcription.timestamp,
                    segmentId: transcription.segmentId
                });
                
                // Update end time
                participantData.endTime = transcription.timestamp;
            }
        }

        // Create final text for each participant
        for (const [participant, data] of participantMap.entries()) {
            data.finalText = data.segments
                .map(segment => segment.text)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        return participantMap;
    }

    /**
     * Save transcription to database
     * @param {string} meetingId - The meeting ID
     * @param {number} userId - User ID
     * @param {string} participant - Participant identity
     * @param {Object} transcript - Transcript data
     */
    async saveTranscriptionToDatabase(meetingId, userId, participant, transcript) {
        try {
            // Create a formatted transcription text
            const formattedText = `[${participant}]: ${transcript.finalText}`;

            await prisma.meetingTranscibtion.create({
                data: {
                    meeting_id: meetingId,
                    user_id: userId,
                    transcribe: formattedText,
                    is_system_transcription: true,
                    created_at: new Date()
                }
            });

            console.log(`✅ Saved transcription for participant ${participant} in meeting ${meetingId}`);
        } catch (error) {
            console.error(`❌ Error saving transcription for participant ${participant}:`, error);
            throw error;
        }
    }

    /**
     * Update meeting status and duration
     * @param {string} meetingId - The meeting ID
     */
    async updateMeetingStatus(meetingId) {
        try {
            const startTime = this.meetingStartTimes.get(meetingId);
            const endTime = this.meetingEndTimes.get(meetingId);
            
            let duration = 0;
            if (startTime && endTime) {
                duration = Math.floor((endTime - startTime) / 1000); // Duration in seconds
            }

            await prisma.meeting.update({
                where: { meeting_id: meetingId },
                data: {
                    status: 'COMPLETED',
                    end_time: endTime || new Date(),
                    duration: duration
                }
            });

            console.log(`✅ Updated meeting ${meetingId} status to COMPLETED with duration ${duration}s`);
        } catch (error) {
            console.error(`❌ Error updating meeting status for ${meetingId}:`, error);
            throw error;
        }
    }

    /**
     * Get transcriptions for a meeting (for debugging)
     * @param {string} meetingId - The meeting ID
     * @returns {Array} Array of transcriptions
     */
    getTranscriptions(meetingId) {
        return this.transcriptions.get(meetingId) || [];
    }

    /**
     * Clear all transcriptions (for cleanup)
     */
    clearAllTranscriptions() {
        this.transcriptions.clear();
        this.meetingStartTimes.clear();
        this.meetingEndTimes.clear();
        console.log('🧹 Cleared all transcription data');
    }

    /**
     * Get meeting statistics
     * @param {string} meetingId - The meeting ID
     * @returns {Object} Meeting statistics
     */
    getMeetingStats(meetingId) {
        const transcriptions = this.transcriptions.get(meetingId) || [];
        const startTime = this.meetingStartTimes.get(meetingId);
        const endTime = this.meetingEndTimes.get(meetingId);

        const participantCount = new Set(transcriptions.map(t => t.participant)).size;
        const finalTranscriptions = transcriptions.filter(t => t.type === 'final').length;
        const interimTranscriptions = transcriptions.filter(t => t.type === 'interim').length;

        return {
            meetingId,
            transcriptionCount: transcriptions.length,
            participantCount,
            finalTranscriptions,
            interimTranscriptions,
            startTime,
            endTime,
            duration: startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0
        };
    }
}

// Export singleton instance
export default new TranscriptionCollectionService();
