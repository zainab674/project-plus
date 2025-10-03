import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CallService {
    /**
     * Create a new call record
     */
    static async createCall(callData) {
        try {
            const call = await prisma.call.create({
                data: callData
            });
            return { success: true, data: call };
        } catch (error) {
            console.error('CallService.createCall error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update call status and details (upsert - create if not exists)
     */
    static async updateCallStatus(callSid, updateData) {
        try {
            // First try to find the call
            const existingCall = await prisma.call.findUnique({
                where: { call_sid: callSid }
            });

            if (existingCall) {
                // Update existing call
                const call = await prisma.call.update({
                    where: { call_sid: callSid },
                    data: updateData
                });
                return { success: true, data: call };
            } else {
                // Call doesn't exist, log this for debugging
                console.warn(`Call with SID ${callSid} not found in database. This might be a webhook for a call that wasn't properly created.`);
                return { success: false, error: `Call with SID ${callSid} not found` };
            }
        } catch (error) {
            console.error('CallService.updateCallStatus error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get call by SID
     */
    static async getCallBySid(callSid) {
        try {
            const call = await prisma.call.findUnique({
                where: { call_sid: callSid }
            });
            return { success: true, data: call };
        } catch (error) {
            console.error('CallService.getCallBySid error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get call history for user with filters
     */
    static async getCallHistory(userId, filters = {}) {
        try {
            const {
                page = 1,
                limit = 50,
                status,
                call_type,
                start_date,
                end_date,
                search
            } = filters;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            const where = { user_id: userId };

            if (status) where.status = status;
            if (call_type) where.call_type = call_type;
            
            if (start_date || end_date) {
                where.start_time = {};
                if (start_date) where.start_time.gte = new Date(start_date);
                if (end_date) where.start_time.lte = new Date(end_date);
            }

            if (search) {
                where.OR = [
                    { to_number: { contains: search } },
                    { from_number: { contains: search } },
                    { contact_name: { contains: search, mode: 'insensitive' } }
                ];
            }

            const [calls, totalCount] = await Promise.all([
                prisma.call.findMany({
                    where,
                    orderBy: { start_time: 'desc' },
                    skip,
                    take: parseInt(limit)
                }),
                prisma.call.count({ where })
            ]);

            return {
                success: true,
                data: {
                    calls,
                    pagination: {
                        current_page: parseInt(page),
                        total_pages: Math.ceil(totalCount / parseInt(limit)),
                        total_count: totalCount,
                        limit: parseInt(limit)
                    }
                }
            };
        } catch (error) {
            console.error('CallService.getCallHistory error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get call statistics for user
     */
    static async getCallStats(userId, periodDays = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - periodDays);

            const [totalCalls, totalDuration, statsByStatus] = await Promise.all([
                prisma.call.count({
                    where: {
                        user_id: userId,
                        start_time: { gte: startDate }
                    }
                }),
                prisma.call.aggregate({
                    where: {
                        user_id: userId,
                        start_time: { gte: startDate },
                        duration: { not: null }
                    },
                    _sum: { duration: true }
                }),
                prisma.call.groupBy({
                    by: ['status', 'call_type'],
                    where: {
                        user_id: userId,
                        start_time: { gte: startDate }
                    },
                    _count: { call_id: true },
                    _sum: { duration: true }
                })
            ]);

            return {
                success: true,
                data: {
                    period_days: periodDays,
                    total_calls: totalCalls,
                    total_duration_seconds: totalDuration._sum.duration || 0,
                    stats_by_status: statsByStatus
                }
            };
        } catch (error) {
            console.error('CallService.getCallStats error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete call record
     */
    static async deleteCall(callId, userId) {
        try {
            // Verify ownership
            const call = await prisma.call.findFirst({
                where: { call_id: callId, user_id: userId }
            });

            if (!call) {
                return { success: false, error: 'Call not found or access denied' };
            }

            await prisma.call.delete({
                where: { call_id: callId }
            });

            return { success: true, message: 'Call deleted successfully' };
        } catch (error) {
            console.error('CallService.deleteCall error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Process Twilio webhook data (upsert - create if not exists)
     */
    static async processWebhookData(webhookData) {
        try {
            const {
                CallSid,
                CallStatus,
                RecordingUrl,
                RecordingDuration,
                CallDuration,
                From,
                To,
                Direction
            } = webhookData;

            if (!CallSid) {
                return { success: false, error: 'CallSid is required' };
            }

            // Map Twilio statuses to our CallStatus enum
            const mapTwilioStatus = (twilioStatus) => {
                switch (twilioStatus?.toLowerCase()) {
                    case 'completed':
                        return 'ENDED';
                    case 'ringing':
                        return 'RINGING';
                    case 'in-progress':
                        return 'PROCESSING';
                    case 'busy':
                        return 'LINE_BUSY';
                    case 'no-answer':
                        return 'NO_RESPONSE';
                    case 'failed':
                    case 'canceled':
                        return 'REJECTED';
                    default:
                        return 'ENDED'; // Default to ENDED for unknown statuses
                }
            };

            // First check if call exists
            const existingCall = await prisma.call.findUnique({
                where: { call_sid: CallSid }
            });

            if (!existingCall) {
                // Call doesn't exist, create it first
                console.log(`Creating new call record for SID: ${CallSid}`);
                
                // Try to determine user_id from phone number (optional)
                let userId = null;
                
                try {
                    // Look for a user with this phone number
                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { phone: From },
                                { phone: To }
                            ]
                        }
                    });
                    
                    if (user) {
                        userId = user.user_id;
                        console.log(`Found user ${userId} for phone number`);
                    } else {
                        console.log(`No user found for phone numbers ${From}/${To}, creating call without user association`);
                    }
                } catch (userError) {
                    console.warn('Error looking up user by phone number:', userError.message);
                    console.log('Creating call without user association');
                }
                
                const newCallData = {
                    user_id: userId, // Can be null now
                    call_sid: CallSid,
                    from_number: From || 'Unknown',
                    to_number: To || 'Unknown',
                    call_type: Direction === 'inbound' ? 'INCOMING' : 'OUTGOING',
                    status: mapTwilioStatus(CallStatus),
                    duration: RecordingDuration ? parseInt(RecordingDuration) : (CallDuration ? parseInt(CallDuration) : 0),
                    recording_url: RecordingUrl || null,
                    start_time: new Date(),
                    end_time: CallStatus?.toLowerCase() === 'completed' ? new Date() : null
                };

                const newCall = await prisma.call.create({
                    data: newCallData
                });
                
                console.log(`Created new call record: ${newCall.call_id}`);
                return { success: true, data: newCall };
            } else {
                // Call exists, update it
                const updateData = {
                    status: mapTwilioStatus(CallStatus),
                    updated_at: new Date()
                };

                if (RecordingUrl) {
                    updateData.recording_url = RecordingUrl;
                }

                if (RecordingDuration) {
                    updateData.duration = parseInt(RecordingDuration);
                } else if (CallDuration) {
                    updateData.duration = parseInt(CallDuration);
                }

                if (CallStatus?.toLowerCase() === 'completed') {
                    updateData.end_time = new Date();
                }

                const result = await this.updateCallStatus(CallSid, updateData);
                return result;
            }
        } catch (error) {
            console.error('CallService.processWebhookData error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default CallService;
