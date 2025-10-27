import { prisma } from '../prisma/index.js';

// Direct transcription service without Kafka/Redis dependency
export class DirectTranscriptionService {
    constructor(meetingId, userId) {
        this.meetingId = meetingId;
        this.userId = userId;
        this.isConnected = false;
    }

    // Handle incoming transcription data directly
    async handleTranscription(transcriptionData) {
        try {
            
            // Save transcription directly to database
            await prisma.meetingTranscibtion.create({
                data: {
                    meeting_id: this.meetingId,
                    user_id: this.userId,
                    transcribe: transcriptionData.text,
                    created_at: new Date()
                }
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Update meeting status when transcription starts
    async startTranscription() {
        try {
            await prisma.meeting.update({
                where: { meeting_id: this.meetingId },
                data: { 
                    status: 'PROCESSING',
                    start_time: new Date()
                }
            });
            this.isConnected = true;
        } catch (error) {
        }
    }

    // Update meeting status when transcription ends
    async endTranscription() {
        try {
            const startTime = await prisma.meeting.findUnique({
                where: { meeting_id: this.meetingId },
                select: { start_time: true }
            });

            let duration = 0;
            if (startTime?.start_time) {
                const endTime = new Date();
                duration = Math.floor((endTime - startTime.start_time) / 1000); // Duration in seconds
            }

            await prisma.meeting.update({
                where: { meeting_id: this.meetingId },
                data: { 
                    status: 'COMPLETED',
                    end_time: new Date(),
                    duration: duration
                }
            });

            this.isConnected = false;
        } catch (error) {
        }
    }

    // Get all transcriptions for this meeting
    async getTranscriptions() {
        try {
            const transcriptions = await prisma.meetingTranscibtion.findMany({
                where: { meeting_id: this.meetingId },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true
                        }
                    }
                },
                orderBy: { created_at: 'asc' }
            });

            return transcriptions;
        } catch (error) {
            return [];
        }
    }
}

// Socket.IO handler for direct transcription
export const initDirectTranscriptionServer = (io) => {

    io.on("connection", async (socket) => {
        const config = socket.handshake.query;
        
        if (!config.user_id || !config.meeting_id) {
            socket.disconnect();
            return;
        }

        // Create transcription service instance
        const transcriptionService = new DirectTranscriptionService(
            config.meeting_id, 
            config.user_id
        );

        // Start transcription
        await transcriptionService.startTranscription();

        // Handle transcription data
        socket.on('transcript', async (data) => {
            const result = await transcriptionService.handleTranscription(data);
            
            // Emit back to all participants in the meeting
            socket.to(`meeting_${config.meeting_id}`).emit('transcript', {
                ...data,
                user_id: config.user_id,
                timestamp: new Date()
            });
        });

        // Join meeting room for broadcasting
        socket.join(`meeting_${config.meeting_id}`);

        // Handle disconnection
        socket.on('disconnect', async () => {
            
            // Check if this was the last participant
            const participants = await io.in(`meeting_${config.meeting_id}`).fetchSockets();
            
            if (participants.length <= 1) {
                // Last participant left, end the meeting
                await transcriptionService.endTranscription();
            }
        });

        // Handle mute/unmute
        socket.on('mute', (isMuted) => {
            socket.to(`meeting_${config.meeting_id}`).emit('participant_mute', {
                user_id: config.user_id,
                muted: isMuted
            });
        });
    });
};

export default DirectTranscriptionService;
