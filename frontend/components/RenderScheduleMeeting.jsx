import React, { useState } from 'react'
import { Card, CardContent } from './ui/card'
import RenderMembers from './RenderMembers'
import moment from 'moment'
import { Clock, Play, Calendar, Users, Trash2 } from 'lucide-react'
import { useUser } from '@/providers/UserProvider'
import { Button } from './Button'
import Link from 'next/link'
import { Badge } from './ui/badge'
import { toast } from 'react-toastify'
import { updateMeetingStatusRequest, deleteMeetingRequest } from '@/lib/http/meeting'

const RenderScheduleMeeting = ({ meetings, getMeetings, onMeetingDeleted }) => {
    const { user } = useUser();
    // Local state to track status changes for immediate UI updates
    const [localMeetingStatuses, setLocalMeetingStatuses] = useState({});
    const [deletingMeetingId, setDeletingMeetingId] = useState(null);

    const handleStatusUpdate = async (meetingId, newStatus) => {
        try {
            // Update local state immediately for instant UI feedback
            setLocalMeetingStatuses(prev => ({
                ...prev,
                [meetingId]: newStatus
            }));

            await updateMeetingStatusRequest(meetingId, newStatus);
            toast.success(`Meeting ${newStatus.toLowerCase()} successfully`);

            // Force refresh the meetings list
            if (getMeetings) {
                await getMeetings();
            }
        } catch (error) {
            // Revert local state if API call fails
            setLocalMeetingStatuses(prev => {
                const newState = { ...prev };
                delete newState[meetingId];
                return newState;
            });
            toast.error(error?.response?.data?.message || 'Failed to update meeting status');
        }
    };

    const handleDeleteMeeting = async (meetingId) => {
        if (window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
            try {
                setDeletingMeetingId(meetingId);
                await deleteMeetingRequest(meetingId);
                toast.success('Meeting deleted successfully');
                
                // Call the callback to refresh the meetings list
                if (onMeetingDeleted) {
                    onMeetingDeleted(meetingId);
                }
                
                if (getMeetings) {
                    await getMeetings();
                }
            } catch (error) {
                console.error('Error deleting meeting:', error);
                toast.error(error?.response?.data?.message || 'Failed to delete meeting');
            } finally {
                setDeletingMeetingId(null);
            }
        }
    };

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'PENDING':
                return 'secondary';
            case 'SCHEDULED':
                return 'default';
            case 'CANCELED':
                return 'destructive';
            case 'COMPLETED':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return 'text-yellow-600';
            case 'SCHEDULED':
                return 'text-green-600';
            case 'CANCELED':
                return 'text-red-600';
            case 'COMPLETED':
                return 'text-blue-600';
            default:
                return 'text-gray-600';
        }
    };

    if (!meetings || meetings.length === 0) {
        return (
            <div className="flex flex-col h-[400px] items-center justify-center text-black gap-4">
                <p>No scheduled meetings</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {meetings.map((meeting) => {
                const currentStatus = localMeetingStatuses[meeting.meeting_id] || meeting.status;
                const isOwner = meeting.user_id === user?.user_id;
                const canManage = user?.Role === 'PROVIDER' && isOwner;

                return (
                    <Card key={meeting.meeting_id} className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900">{meeting.heading}</h3>
                                        <Badge variant={getStatusBadgeVariant(currentStatus)} className={getStatusColor(currentStatus)}>
                                            {currentStatus}
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-gray-600 mb-4">{meeting.description}</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="h-4 w-4" />
                                            <span>{moment(meeting.date).format('MMM DD, YYYY')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span>{moment(meeting.time).format('h:mm A')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Users className="h-4 w-4" />
                                            <span>{meeting.participants?.length || 0} participants</span>
                                        </div>
                                    </div>

                                    {/* Participants */}
                                    {meeting.participants && meeting.participants.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Participants:</h4>
                                            <RenderMembers members={meeting.participants.map(p => p.user)} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    {canManage && (
                                        <>
                                            {currentStatus === 'PENDING' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleStatusUpdate(meeting.meeting_id, 'SCHEDULED')}
                                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                                >
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    Confirm
                                                </Button>
                                            )}
                                            {currentStatus === 'SCHEDULED' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleStatusUpdate(meeting.meeting_id, 'CANCELED')}
                                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteMeeting(meeting.meeting_id)}
                                                disabled={deletingMeetingId === meeting.meeting_id}
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    
                                    <Link href={`/meeting/${meeting.meeting_id}`}>
                                        <Button size="sm" className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover">
                                            <Play className="h-4 w-4 mr-1" />
                                            Join Meeting
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default RenderScheduleMeeting;