import "dotenv/config";
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { prisma } from '../prisma/index.js';

// Create a new call record
export const createCall = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { 
            call_sid, 
            from_number, 
            to_number, 
            contact_name, 
            call_type = 'OUTGOING',
            status = 'RINGING' 
        } = req.body;

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        if (!from_number || !to_number) {
            return next(new ErrorHandler('From and To numbers are required', 400));
        }

        const call = await prisma.call.create({
            data: {
                user_id: userId,
                call_sid,
                from_number,
                to_number,
                contact_name,
                call_type,
                status
            }
        });

        res.status(201).json({
            success: true,
            message: 'Call record created successfully',
            data: call
        });

    } catch (error) {
        console.error('Create call error:', error);
        return next(new ErrorHandler(`Failed to create call record: ${error.message}`, 500));
    }
});

// Get call history for a user
export const getCallHistory = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { 
            page = 1, 
            limit = 50, 
            status, 
            call_type, 
            start_date, 
            end_date,
            search 
        } = req.query;

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build where clause - include calls with user_id or without user association
        const where = {
            OR: [
                { user_id: userId },
                { user_id: null }
            ]
        };

        if (status) {
            where.status = status;
        }

        if (call_type) {
            where.call_type = call_type;
        }

        if (start_date || end_date) {
            where.start_time = {};
            if (start_date) {
                where.start_time.gte = new Date(start_date);
            }
            if (end_date) {
                where.start_time.lte = new Date(end_date);
            }
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

        res.status(200).json({
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
        });

    } catch (error) {
        console.error('Get call history error:', error);
        return next(new ErrorHandler(`Failed to fetch call history: ${error.message}`, 500));
    }
});

// Update call status
export const updateCallStatus = catchAsyncError(async (req, res, next) => {
    try {
        const { call_id } = req.params;
        const { 
            status, 
            duration, 
            end_time, 
            recording_url, 
            error_message,
            transcript
        } = req.body;

        if (!call_id) {
            return next(new ErrorHandler('Call ID is required', 400));
        }

        // Map status to valid CallStatus enum if needed
        const mapStatus = (statusValue) => {
            if (!statusValue) return statusValue;
            
            switch (statusValue?.toLowerCase()) {
                case 'completed':
                    return 'ENDED';
                case 'ringing':
                    return 'RINGING';
                case 'in-progress':
                case 'processing':
                    return 'PROCESSING';
                case 'busy':
                    return 'LINE_BUSY';
                case 'no-answer':
                    return 'NO_RESPONSE';
                case 'failed':
                case 'canceled':
                    return 'REJECTED';
                default:
                    // If it's already a valid enum value, return as is
                    if (['RINGING', 'PROCESSING', 'REJECTED', 'ENDED', 'NO_RESPONSE', 'LINE_BUSY'].includes(statusValue?.toUpperCase())) {
                        return statusValue.toUpperCase();
                    }
                    return 'ENDED'; // Default fallback
            }
        };

        const updateData = {};
        if (status) updateData.status = mapStatus(status);
        if (duration !== undefined) updateData.duration = duration;
        if (end_time) updateData.end_time = new Date(end_time);
        if (recording_url) updateData.recording_url = recording_url;
        if (error_message) updateData.error_message = error_message;
        if (transcript) updateData.transcript = transcript;

        const call = await prisma.call.update({
            where: { call_id },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: 'Call status updated successfully',
            data: call
        });

    } catch (error) {
        console.error('Update call status error:', error);
        return next(new ErrorHandler(`Failed to update call status: ${error.message}`, 500));
    }
});

// Update call description
export const updateCallDescription = catchAsyncError(async (req, res, next) => {
    try {
        const { call_id } = req.params;
        const { description } = req.body;
        const userId = req.user?.user_id;

        if (!call_id) {
            return next(new ErrorHandler('Call ID is required', 400));
        }

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        // Verify the call belongs to the user
        const existingCall = await prisma.call.findFirst({
            where: {
                call_id,
                user_id: userId
            }
        });

        if (!existingCall) {
            return next(new ErrorHandler('Call not found or unauthorized', 404));
        }

        const call = await prisma.call.update({
            where: { call_id },
            data: { description }
        });

        res.status(200).json({
            success: true,
            message: 'Call description updated successfully',
            data: call
        });

    } catch (error) {
        console.error('Update call description error:', error);
        return next(new ErrorHandler(`Failed to update call description: ${error.message}`, 500));
    }
});

// Get call statistics
export const getCallStats = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { period = '30' } = req.query; // days

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const stats = await prisma.call.groupBy({
            by: ['status', 'call_type'],
            where: {
                user_id: userId,
                start_time: {
                    gte: startDate
                }
            },
            _count: {
                call_id: true
            },
            _sum: {
                duration: true
            }
        });

        // Calculate total calls and duration
        const totalCalls = await prisma.call.count({
            where: {
                user_id: userId,
                start_time: {
                    gte: startDate
                }
            }
        });

        const totalDuration = await prisma.call.aggregate({
            where: {
                user_id: userId,
                start_time: {
                    gte: startDate
                },
                duration: {
                    not: null
                }
            },
            _sum: {
                duration: true
            }
        });

        res.status(200).json({
            success: true,
            data: {
                period_days: parseInt(period),
                total_calls: totalCalls,
                total_duration_seconds: totalDuration._sum.duration || 0,
                stats_by_status: stats
            }
        });

    } catch (error) {
        console.error('Get call stats error:', error);
        return next(new ErrorHandler(`Failed to fetch call statistics: ${error.message}`, 500));
    }
});

// Delete call record
export const deleteCall = catchAsyncError(async (req, res, next) => {
    try {
        const { call_id } = req.params;
        const userId = req.user?.user_id;

        if (!userId) {
            return next(new ErrorHandler('User authentication required', 401));
        }

        // Verify the call belongs to the user
        const call = await prisma.call.findFirst({
            where: {
                call_id,
                user_id: userId
            }
        });

        if (!call) {
            return next(new ErrorHandler('Call not found or access denied', 404));
        }

        await prisma.call.delete({
            where: { call_id }
        });

        res.status(200).json({
            success: true,
            message: 'Call record deleted successfully'
        });

    } catch (error) {
        console.error('Delete call error:', error);
        return next(new ErrorHandler(`Failed to delete call record: ${error.message}`, 500));
    }
});

// Get call by SID (for webhook updates)
export const getCallBySid = catchAsyncError(async (req, res, next) => {
    try {
        const { call_sid } = req.params;

        const call = await prisma.call.findUnique({
            where: { call_sid }
        });

        if (!call) {
            return next(new ErrorHandler('Call not found', 404));
        }

        res.status(200).json({
            success: true,
            data: call
        });

    } catch (error) {
        console.error('Get call by SID error:', error);
        return next(new ErrorHandler(`Failed to fetch call: ${error.message}`, 500));
    }
});
