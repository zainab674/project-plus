import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { prisma } from '../prisma/index.js';
import transcriptionCollectionService from '../services/transcriptionCollectionService.js';

// Direct transcription endpoint without Kafka/Redis
export const saveTranscription = catchAsyncError(async (req, res, next) => {
    const { meeting_id, user_id, text, is_final } = req.body;

    if (!meeting_id || !user_id || !text) {
        return next(new ErrorHandler("Meeting ID, User ID, and text are required", 400));
    }

    try {
        // Verify meeting exists
        const meeting = await prisma.meeting.findUnique({
            where: { meeting_id },
            select: { meeting_id: true, status: true }
        });

        if (!meeting) {
            return next(new ErrorHandler("Meeting not found", 404));
        }

        // Save transcription directly to database
        const transcription = await prisma.meetingTranscibtion.create({
            data: {
                meeting_id,
                user_id: parseInt(user_id),
                transcribe: text,
                created_at: new Date()
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        user_id: true
                    }
                }
            }
        });

        console.log('✅ Transcription saved:', transcription.meeting_transcribtion_id);

        res.status(200).json({
            success: true,
            message: "Transcription saved successfully",
            transcription: {
                id: transcription.meeting_transcribtion_id,
                text: transcription.transcribe,
                user: transcription.user,
                created_at: transcription.created_at,
                is_final: is_final || false
            }
        });

    } catch (error) {
        console.error('❌ Error saving transcription:', error);
        return next(new ErrorHandler("Failed to save transcription", 500));
    }
});

// New endpoint for LiveKit agent transcriptions
export const handleLiveKitTranscription = catchAsyncError(async (req, res, next) => {
    const { meeting_id, transcription_data } = req.body;

    if (!meeting_id || !transcription_data) {
        return next(new ErrorHandler("Meeting ID and transcription data are required", 400));
    }

    try {
        // Add transcription to collection service (for real-time processing)
        transcriptionCollectionService.addTranscription(meeting_id, transcription_data);

        // Also save transcription immediately to database
        if (transcription_data.type === 'final' && transcription_data.text && transcription_data.text.trim()) {
            try {
                // Get meeting info to find user_id
                const meeting = await prisma.meeting.findUnique({
                    where: { meeting_id },
                    select: { user_id: true }
                });

                if (meeting) {
                    // Save transcription to database immediately
                    await prisma.meetingTranscibtion.create({
                        data: {
                            meeting_id,
                            user_id: meeting.user_id,
                            transcribe: `[${transcription_data.participant}]: ${transcription_data.text}`,
                            is_system_transcription: true,
                            created_at: new Date()
                        }
                    });
                    console.log(`✅ LiveKit transcription saved to database: ${transcription_data.text.substring(0, 50)}...`);
                }
            } catch (dbError) {
                console.error('❌ Error saving LiveKit transcription to database:', dbError);
                // Don't fail the request if DB save fails
            }
        }

        res.status(200).json({
            success: true,
            message: "Transcription received and stored",
            meeting_id: meeting_id,
            type: transcription_data.type,
            participant: transcription_data.participant
        });

    } catch (error) {
        console.error('❌ Error handling LiveKit transcription:', error);
        return next(new ErrorHandler("Failed to handle transcription", 500));
    }
});

// Endpoint to start meeting transcription collection
export const startMeetingTranscription = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;

    if (!meeting_id) {
        return next(new ErrorHandler("Meeting ID is required", 400));
    }

    try {
        // Verify meeting exists
        const meeting = await prisma.meeting.findUnique({
            where: { meeting_id },
            select: { meeting_id: true, status: true }
        });

        if (!meeting) {
            return next(new ErrorHandler("Meeting not found", 404));
        }

        // Start transcription collection
        transcriptionCollectionService.startMeeting(meeting_id);

        res.status(200).json({
            success: true,
            message: "Meeting transcription collection started",
            meeting_id: meeting_id
        });

    } catch (error) {
        console.error('❌ Error starting meeting transcription:', error);
        return next(new ErrorHandler("Failed to start transcription collection", 500));
    }
});

// Endpoint to end meeting and save transcriptions
export const endMeetingTranscription = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const user_id = req.user.user_id;

    if (!meeting_id) {
        return next(new ErrorHandler("Meeting ID is required", 400));
    }

    try {
        // Verify meeting exists and user has permission
        const meeting = await prisma.meeting.findFirst({
            where: {
                meeting_id: meeting_id,
                OR: [
                    { user_id: user_id }, // Meeting creator
                    { participants: { some: { user_id: user_id } } } // Meeting participant
                ]
            },
            select: { meeting_id: true, status: true }
        });

        if (!meeting) {
            return next(new ErrorHandler("Meeting not found or you don't have permission", 404));
        }

        // End meeting and process transcriptions
        await transcriptionCollectionService.endMeeting(meeting_id, user_id);

        // Get meeting statistics
        const stats = transcriptionCollectionService.getMeetingStats(meeting_id);

        res.status(200).json({
            success: true,
            message: "Meeting ended and transcriptions saved successfully",
            meeting_id: meeting_id,
            statistics: stats
        });

    } catch (error) {
        console.error('❌ Error ending meeting transcription:', error);
        return next(new ErrorHandler("Failed to end meeting and save transcriptions", 500));
    }
});

// Get transcription statistics for a meeting
export const getTranscriptionStats = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const user_id = req.user.user_id;

    if (!meeting_id) {
        return next(new ErrorHandler("Meeting ID is required", 400));
    }

    try {
        // Verify meeting exists and user has permission
        const meeting = await prisma.meeting.findFirst({
            where: {
                meeting_id: meeting_id,
                OR: [
                    { user_id: user_id },
                    { participants: { some: { user_id: user_id } } }
                ]
            }
        });

        if (!meeting) {
            return next(new ErrorHandler("Meeting not found or you don't have permission", 404));
        }

        // Get statistics from collection service
        const stats = transcriptionCollectionService.getMeetingStats(meeting_id);

        // Get saved transcriptions from database
        const savedTranscriptions = await prisma.meetingTranscibtion.findMany({
            where: { meeting_id: meeting_id },
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

        res.status(200).json({
            success: true,
            meeting_id: meeting_id,
            live_stats: stats,
            saved_transcriptions: savedTranscriptions,
            total_saved: savedTranscriptions.length
        });

    } catch (error) {
        console.error('❌ Error getting transcription stats:', error);
        return next(new ErrorHandler("Failed to get transcription statistics", 500));
    }
});

// Get all transcriptions for a meeting
export const getMeetingTranscriptions = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const user_id = req.user.user_id;

    if (!meeting_id) {
        return next(new ErrorHandler("Meeting ID is required", 400));
    }

    try {
        // Verify user has access to this meeting
        const meeting = await prisma.meeting.findFirst({
            where: {
                meeting_id,
                OR: [
                    { user_id: user_id },
                    { participants: { some: { user_id: user_id } } }
                ]
            }
        });

        if (!meeting) {
            return next(new ErrorHandler("Meeting not found or access denied", 404));
        }

        // Get all transcriptions for the meeting
        const transcriptions = await prisma.meetingTranscibtion.findMany({
            where: { meeting_id },
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

        res.status(200).json({
            success: true,
            transcriptions,
            meeting: {
                id: meeting.meeting_id,
                heading: meeting.heading,
                status: meeting.status,
                start_time: meeting.start_time,
                end_time: meeting.end_time,
                duration: meeting.duration
            }
        });

    } catch (error) {
        console.error('❌ Error fetching transcriptions:', error);
        return next(new ErrorHandler("Failed to fetch transcriptions", 500));
    }
});

// Update meeting status
export const updateMeetingStatus = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const { status, start_time, end_time } = req.body;
    const user_id = req.user.user_id;

    if (!meeting_id || !status) {
        return next(new ErrorHandler("Meeting ID and status are required", 400));
    }

    try {
        // Verify user is meeting creator or participant
        const meeting = await prisma.meeting.findFirst({
            where: {
                meeting_id,
                OR: [
                    { user_id: user_id }, // Meeting creator
                    { 
                        participants: {
                            some: { user_id: user_id }
                        }
                    } // Meeting participant
                ]
            }
        });

        if (!meeting) {
            return next(new ErrorHandler("Meeting not found or access denied", 404));
        }

        const updateData = { status };
        
        if (start_time) updateData.start_time = new Date(start_time);
        if (end_time) updateData.end_time = new Date(end_time);

        // Calculate duration if both start and end times are provided
        if (start_time && end_time) {
            const start = new Date(start_time);
            const end = new Date(end_time);
            updateData.duration = Math.floor((end - start) / 1000); // Duration in seconds
        }

        const updatedMeeting = await prisma.meeting.update({
            where: { meeting_id },
            data: updateData,
            include: {
                participants: {
                    select: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                user_id: true
                            }
                        },
                        vote: true
                    }
                },
                transcribtions: {
                    select: {
                        transcribe: true,
                        created_at: true,
                        user: {
                            select: {
                                name: true,
                                user_id: true
                            }
                        }
                    },
                    orderBy: { created_at: 'asc' }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Meeting status updated successfully",
            meeting: updatedMeeting
        });

    } catch (error) {
        console.error('❌ Error updating meeting status:', error);
        return next(new ErrorHandler("Failed to update meeting status", 500));
    }
});

// Get meeting statistics
export const getMeetingStats = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const user_id = req.user.user_id;

    try {
        // Verify user has access to this meeting
        const meeting = await prisma.meeting.findFirst({
            where: {
                meeting_id,
                OR: [
                    { user_id: user_id },
                    { participants: { some: { user_id: user_id } } }
                ]
            },
            include: {
                transcribtions: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                user_id: true
                            }
                        }
                    }
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                user_id: true
                            }
                        }
                    }
                }
            }
        });

        if (!meeting) {
            return next(new ErrorHandler("Meeting not found or access denied", 404));
        }

        // Calculate statistics
        const totalTranscriptions = meeting.transcribtions.length;
        const totalParticipants = meeting.participants.length;
        const totalWords = meeting.transcribtions.reduce((sum, t) => {
            return sum + (t.transcribe ? t.transcribe.split(' ').length : 0);
        }, 0);

        // Group transcriptions by user
        const transcriptionsByUser = meeting.transcribtions.reduce((acc, t) => {
            const userId = t.user.user_id;
            if (!acc[userId]) {
                acc[userId] = {
                    user: t.user,
                    count: 0,
                    words: 0
                };
            }
            acc[userId].count++;
            acc[userId].words += t.transcribe ? t.transcribe.split(' ').length : 0;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            stats: {
                meeting_id: meeting.meeting_id,
                heading: meeting.heading,
                status: meeting.status,
                duration: meeting.duration,
                start_time: meeting.start_time,
                end_time: meeting.end_time,
                total_transcriptions: totalTranscriptions,
                total_participants: totalParticipants,
                total_words: totalWords,
                transcriptions_by_user: Object.values(transcriptionsByUser)
            }
        });

    } catch (error) {
        console.error('❌ Error fetching meeting stats:', error);
        return next(new ErrorHandler("Failed to fetch meeting statistics", 500));
    }
});
