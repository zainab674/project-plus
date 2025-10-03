import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { sendInviation, sendMailDetails, sendMailUpdate, sendMeetingLink } from '../services/meetingService.js';
import { prisma } from "../prisma/index.js";
import { AccessToken, RoomServiceClient, AgentDispatchClient } from 'livekit-server-sdk';
import agentDispatchService from '../services/agentDispatchService.js';
import transcriptionCollectionService from '../services/transcriptionCollectionService.js';

export const createMeeting = catchAsyncError(async (req, res, next) => {
    const { heading, description, task_id, time, date, isScheduled, mail_text } = req.body;
    if (!heading || !description || !task_id) return next(new ErrorHandler("Heading and description and task_id is required"));
    const user_id = req.user.user_id;


    const task = await prisma.task.findUnique({
        where: {
            task_id: parseInt(task_id)
        },
        include: {
            assignees: {
                select: {
                    user: {
                        select: {
                            email: true,
                            name: true,
                            user_id: true
                        }
                    }
                }
            }
        }
    });


    if (!task) return next(new ErrorHandler("Invalid task_id"));


    const participantsData = task.assignees.map((assignee) => ({
        user_id: assignee.user.user_id,
        vote: 'PENDING'
    }));

    const meeting = await prisma.meeting.create({
        data: {
            heading,
            description,
            task_id: parseInt(task_id),
            user_id,
            isScheduled,
            date: isScheduled ? date : null,
            time: isScheduled ? time : null,
            project_id: task.project_id,
            status: isScheduled ? "PENDING" : "PROCESSING",
            participants: {
                create: participantsData
            }
        }
    });


    // Send meeting invitations/links
    try {
        if (isScheduled) {
            await sendInviation(task.assignees, heading, description, meeting.meeting_id, date, time, req.user.name, req.user.email);
        } else {
            // Send meeting links for immediate team meetings
            const meetingInfo = {
                heading,
                description,
                meeting_id: meeting.meeting_id
            };
            
            // Send meeting links to all team members
            const emailResults = [];
            for (const assignee of task.assignees) {
                try {
                    const result = await sendMeetingLink(assignee.user.name, assignee.user.email, meetingInfo);
                    emailResults.push({ email: assignee.user.email, success: true, messageId: result.messageId });
                } catch (error) {
                    console.error(`Failed to send instant meeting link to ${assignee.user.email}:`, error.message);
                    emailResults.push({ email: assignee.user.email, success: false, error: error.message });
                }
            }
            
            // Log email sending results
            const successful = emailResults.filter(r => r.success).length;
            const failed = emailResults.filter(r => !r.success).length;
            console.log(`📧 Instant meeting emails: ${successful} sent successfully, ${failed} failed`);
        }
    } catch (error) {
        console.error('❌ Error sending meeting invitations:', error.message);
        // Don't fail the meeting creation if email sending fails
        // The meeting is still created, just emails might not be sent
    }

    // Return the conversation ID in the response
    res.status(200).json({
        success: true,
        message: "Meeting Created Successfully",
        meeting
    });
});


export const createClientMeeting = catchAsyncError(async (req, res, next) => {
    const { heading, description, task_id, time, date, isScheduled, client_id } = req.body;
    if (!heading || !description || !task_id) return next(new ErrorHandler("Heading and description and task_id is required"));
    const user_id = req.user.user_id;


    const task = await prisma.task.findUnique({
        where: {
            task_id: parseInt(task_id)
        }
    });

    const client = await prisma.user.findUnique({
        where: {
            user_id: parseInt(client_id)
        }
    });


    if (!task) return next(new ErrorHandler("Invalid task_id"));


    const participantsData = [{
        user_id: parseInt(client_id),
        vote: 'PENDING'
    }];

    const meeting = await prisma.meeting.create({
        data: {
            heading,
            description,
            task_id: parseInt(task_id),
            user_id,
            isScheduled,
            date: isScheduled ? date : null,
            time: isScheduled ? time : null,
            project_id: task.project_id,
            status: isScheduled ? "PENDING" : "PROCESSING",
            participants: {
                create: participantsData
            }
        }
    });


    if (isScheduled) {
        // For scheduled client meetings, send invitation to the client
        sendInviation([{ user: client }], heading, description, meeting.meeting_id, date, time, req.user.name, req.user.email);
    } else {
        // For immediate client meetings, send meeting link
        sendMeetingLink(client.name, client.email, {
            heading,
            description,
            meeting_id: meeting.meeting_id
        });
    }



    await prisma.taskProgress.create({
        data: {
            message: `User Send a mail subject: ${heading}`,
            user_id: user_id,
            task_id: parseInt(task_id),
            type: "MEETING"
        }
    });


    // Return the conversation ID in the response
    res.status(200).json({
        success: true,
        message: "Meeting Created Successfully",
        meeting
    });
});


export const handleVoting = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const { user_id, vote } = req.query;

    if (!meeting_id || !user_id) return next(new ErrorHandler("Metting Id and User Id is required."));

    const voteValue = Number(vote) ? "ACCEPTED" : "REJECTED";
    const participantInfo = await prisma.meetingParticipant.findFirst({
        where: {
            meeting_id,
            user_id: parseInt(user_id),
        },
    });

    if (!participantInfo) return next(new ErrorHandler("Invalid Meeting ID"));

    const participant = await prisma.meetingParticipant.update({
        where: {
            meeting_participant_id: participantInfo.meeting_participant_id
        },
        data: {
            vote: voteValue
        }
    });


    const meeting = await prisma.meeting.findUnique({
        where: {
            meeting_id
        },
        include: {
            participants: {
                select: {
                    vote: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true
                        }
                    }
                }
            },
            user: {
                select: {
                    name: true,
                    email: true,
                    user_id: true
                }
            }
        }
    });

    if (!meeting) return next(new ErrorHandler("Invalid Meeting ID"));

    sendMailDetails(meeting);

    res.redirect(`${process.env.FRONTEND_URL}/vote-sccuess?vote=${voteValue}`);
});





export const handleConfirm = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const { user_id, vote } = req.query;

    if (!meeting_id || !user_id) return next(new ErrorHandler("Metting Id and User Id is required."));

    const voteValue = Number(vote) ? "SCHEDULED" : "CANCELED";
    const meetingInfo = await prisma.meeting.update({
        where: {
            meeting_id
        },
        data: {
            status: voteValue
        },
        include: {
            participants: {
                select: {
                    vote: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true
                        }
                    }
                }
            },
            user: {
                select: {
                    name: true,
                    email: true,
                    user_id: true
                }
            },
            task: {
                select: {
                    assignees: {
                        select: {
                            user: {
                                select: {
                                    email: true,
                                    name: true,
                                    user_id: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });


    if (!meetingInfo) return next(new ErrorHandler("Invalid Meeting ID"));
    sendMailUpdate(meetingInfo, voteValue);
    res.redirect(`${process.env.FRONTEND_URL}/vote-confirm?vote=${voteValue}`);
});



export const getMeetings = catchAsyncError(async (req, res, next) => {
    const { isScheduled } = req.query;
    const user_id = req.user.user_id;

    // Build the where clause
    const whereClause = {
        OR: [
            { user_id: user_id },
            { participants: { some: { user_id: user_id } } }
        ]
    };

    // Only filter by isScheduled if the parameter is provided
    if (isScheduled !== undefined) {
        whereClause.isScheduled = isScheduled === 'true';
    }

    const meetings = await prisma.meeting.findMany({
        where: whereClause,
        orderBy: {
            created_at: 'desc'
        },
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
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true
                        }
                    },
                    transcribe: true
                }
            }
        }
    });

    res.status(200).json({
        success: true,
        meetings
    })
});





export const getMeetingBYId = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const meeting = await prisma.meeting.findUnique({
        where: {
            meeting_id: meeting_id
        }
    });

    if (!meeting) return next(new ErrorHandler("Invalid Meeting Id", 404));

    res.status(200).json({
        success: true,
        meeting
    })
});

export const updateMeetingStatus = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const { status } = req.body;
    const user_id = req.user.user_id;

    if (!meeting_id || !status) return next(new ErrorHandler("Meeting ID and status are required."));

    // Check if user is the meeting creator
    const meeting = await prisma.meeting.findFirst({
        where: {
            meeting_id: meeting_id,
            user_id: user_id
        }
    });

    if (!meeting) return next(new ErrorHandler("Meeting not found or you don't have permission to update it."));

    const updatedMeeting = await prisma.meeting.update({
        where: {
            meeting_id: meeting_id
        },
        data: {
            status: status
        },
        include: {
            participants: {
                select: {
                    vote: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true
                        }
                    }
                }
            },
            user: {
                select: {
                    name: true,
                    email: true,
                    user_id: true
                }
            },
            task: {
                select: {
                    assignees: {
                        select: {
                            user: {
                                select: {
                                    email: true,
                                    name: true,
                                    user_id: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    // Send email update to participants
    sendMailUpdate(updatedMeeting, status);

    res.status(200).json({
        success: true,
        message: "Meeting status updated successfully",
        meeting: updatedMeeting
    });
});

export const deleteMeeting = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const user_id = req.user.user_id;

    if (!meeting_id) return next(new ErrorHandler("Meeting ID is required."));

    // Check if user is the meeting creator
    const meeting = await prisma.meeting.findFirst({
        where: {
            meeting_id: meeting_id,
            user_id: user_id
        }
    });

    if (!meeting) return next(new ErrorHandler("Meeting not found or you don't have permission to delete it."));

    // Delete meeting and all related data
    await prisma.meeting.delete({
        where: {
            meeting_id: meeting_id
        }
    });

    res.status(200).json({
        success: true,
        message: "Meeting deleted successfully"
    });
});

// LiveKit Token Generation
export const generateLiveKitToken = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const user_id = req.user.user_id;

    if (!meeting_id) return next(new ErrorHandler("Meeting ID is required."));

    // Check if user is authorized to join this meeting
    const meeting = await prisma.meeting.findFirst({
        where: {
            meeting_id: meeting_id,
            OR: [
                { user_id: user_id }, // Meeting creator
                { participants: { some: { user_id: user_id } } } // Meeting participant
            ]
        },
        include: {
            participants: {
                select: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true
                        }
                    }
                }
            },
            user: {
                select: {
                    name: true,
                    email: true,
                    user_id: true
                }
            }
        }
    });

    if (!meeting) return next(new ErrorHandler("Meeting not found or you don't have permission to join."));

    // Get user info for token
    const user = await prisma.user.findUnique({
        where: { user_id: user_id },
        select: { name: true, email: true }
    });

    if (!user) return next(new ErrorHandler("User not found."));

    try {
        // Create LiveKit access token
        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: user.email, // Use email as identity
                name: user.name,
                // Token expires after 2 hours
                ttl: '2h',
            }
        );

        // Add room join grant
        at.addGrant({
            roomJoin: true,
            room: `meeting-${meeting_id}`, // Use meeting ID as room name
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            canUpdateOwnMetadata: true,
        });

        // Generate JWT token
        const token = await at.toJwt();

        // Automatically dispatch agent to the room when token is generated
        try {
            await agentDispatchService.dispatchTranscriberToMeeting(
                meeting_id,
                {
                    meeting_id: meeting.meeting_id,
                    heading: meeting.heading,
                    description: meeting.description,
                    status: meeting.status
                },
                user_id
            );
            console.log(`Agent 'transcriber' dispatched to room: meeting-${meeting_id}`);
        } catch (dispatchError) {
            console.error('Failed to dispatch agent automatically:', dispatchError);
            // Don't fail token generation if dispatch fails
        }

        // Log that we're generating a token for a room with agent dispatch
        console.log(`Generating LiveKit token for room: meeting-${meeting_id}`);
        console.log(`LiveKit URL: ${process.env.LIVEKIT_URL || process.env.LIVEKIT_HOST}`);
        console.log(`Agent 'transcriber' will be dispatched to this room`);

        res.status(200).json({
            success: true,
            token: token,
            roomName: `meeting-${meeting_id}`,
            serverUrl: process.env.LIVEKIT_URL,
            meeting: {
                meeting_id: meeting.meeting_id,
                heading: meeting.heading,
                description: meeting.description,
                status: meeting.status
            }
        });

    } catch (error) {
        console.error('Error generating LiveKit token:', error);
        return next(new ErrorHandler("Failed to generate meeting token."));
    }
});

// API-based Agent Dispatch
export const dispatchAgentToMeeting = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const user_id = req.user.user_id;

    if (!meeting_id) return next(new ErrorHandler("Meeting ID is required."));

    // Check if user is authorized to dispatch agent to this meeting
    const meeting = await prisma.meeting.findFirst({
        where: {
            meeting_id: meeting_id,
            OR: [
                { user_id: user_id }, // Meeting creator
                { participants: { some: { user_id: user_id } } } // Meeting participant
            ]
        },
        select: {
            meeting_id: true,
            heading: true,
            description: true,
            status: true
        }
    });

    if (!meeting) return next(new ErrorHandler("Meeting not found or you don't have permission to dispatch agent."));

    try {
        // Dispatch transcriber agent to the meeting room
        const dispatch = await agentDispatchService.dispatchTranscriberToMeeting(
            meeting_id,
            meeting,
            user_id
        );

        res.status(200).json({
            success: true,
            message: "Agent dispatched successfully",
            dispatch: dispatch,
            roomName: `meeting-${meeting_id}`,
            agentName: 'transcriber'
        });

    } catch (error) {
        console.error('Error dispatching agent:', error);
        return next(new ErrorHandler("Failed to dispatch agent to meeting."));
    }
});

// Check agent dispatch status
export const checkAgentDispatchStatus = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const user_id = req.user.user_id;

    if (!meeting_id) return next(new ErrorHandler("Meeting ID is required."));

    // Check if user is authorized to check dispatch status
    const meeting = await prisma.meeting.findFirst({
        where: {
            meeting_id: meeting_id,
            OR: [
                { user_id: user_id },
                { participants: { some: { user_id: user_id } } }
            ]
        }
    });

    if (!meeting) return next(new ErrorHandler("Meeting not found or you don't have permission."));

    try {
        const roomName = `meeting-${meeting_id}`;
        const dispatches = await agentDispatchService.listDispatches(roomName);
        const isTranscriberDispatched = await agentDispatchService.isAgentDispatched(roomName, 'transcriber');

        res.status(200).json({
            success: true,
            roomName: roomName,
            dispatches: dispatches,
            isTranscriberDispatched: isTranscriberDispatched,
            totalDispatches: dispatches.length
        });

    } catch (error) {
        console.error('Error checking agent dispatch status:', error);
        return next(new ErrorHandler("Failed to check agent dispatch status."));
    }
});

// End meeting and save transcriptions
export const endMeeting = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const user_id = req.user.user_id;

    if (!meeting_id) return next(new ErrorHandler("Meeting ID is required."));

    // Check if user is authorized to end this meeting
    const meeting = await prisma.meeting.findFirst({
        where: {
            meeting_id: meeting_id,
            OR: [
                { user_id: user_id }, // Meeting creator
                { participants: { some: { user_id: user_id } } } // Meeting participant
            ]
        },
        include: {
            participants: {
                select: {
                    vote: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true
                        }
                    }
                }
            },
            user: {
                select: {
                    name: true,
                    email: true,
                    user_id: true
                }
            }
        }
    });

    if (!meeting) return next(new ErrorHandler("Meeting not found or you don't have permission to end it."));

    try {
        // End meeting and process transcriptions
        await transcriptionCollectionService.endMeeting(meeting_id, user_id);

        // Get meeting statistics
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

        // Update task progress
        await prisma.taskProgress.create({
            data: {
                message: `Meeting "${meeting.heading}" ended and transcriptions saved`,
                user_id: user_id,
                task_id: meeting.task_id,
                type: "MEETING"
            }
        });

        res.status(200).json({
            success: true,
            message: "Meeting ended and transcriptions saved successfully",
            meeting: {
                meeting_id: meeting.meeting_id,
                heading: meeting.heading,
                description: meeting.description,
                status: "COMPLETED",
                duration: stats.duration
            },
            transcription_stats: {
                total_segments: stats.transcriptionCount,
                participants: stats.participantCount,
                duration: stats.duration,
                saved_transcriptions: savedTranscriptions.length
            },
            transcriptions: savedTranscriptions
        });

    } catch (error) {
        console.error('Error ending meeting:', error);
        return next(new ErrorHandler("Failed to end meeting and save transcriptions."));
    }
});

// Start meeting transcription collection
export const startMeetingTranscription = catchAsyncError(async (req, res, next) => {
    const { meeting_id } = req.params;
    const user_id = req.user.user_id;

    if (!meeting_id) return next(new ErrorHandler("Meeting ID is required."));

    // Check if user is authorized
    const meeting = await prisma.meeting.findFirst({
        where: {
            meeting_id: meeting_id,
            OR: [
                { user_id: user_id },
                { participants: { some: { user_id: user_id } } }
            ]
        }
    });

    if (!meeting) return next(new ErrorHandler("Meeting not found or you don't have permission."));

    try {
        // Start transcription collection
        transcriptionCollectionService.startMeeting(meeting_id);

        res.status(200).json({
            success: true,
            message: "Meeting transcription collection started",
            meeting_id: meeting_id
        });

    } catch (error) {
        console.error('Error starting meeting transcription:', error);
        return next(new ErrorHandler("Failed to start transcription collection."));
    }
});