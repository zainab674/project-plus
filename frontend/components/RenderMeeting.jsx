import React, { useState } from 'react'
import { Card, CardContent } from './ui/card'
import RenderMembers from './RenderMembers'
import moment from 'moment'
import { Clock, Play, MessageSquare, Trash2 } from 'lucide-react'
import RenderTranscibtionChat from './RenderTranscibtionChat'
import { Badge } from './ui/badge'
import TranscriptionPopup from './TranscriptionPopup'
import { deleteMeetingRequest } from '@/lib/http/meeting'
import { toast } from 'react-toastify'
import { useUser } from '@/providers/UserProvider'

const RenderMeeting = ({ meetings, onMeetingDeleted }) => {
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [showTranscriptionPopup, setShowTranscriptionPopup] = useState(false);
    const [deletingMeetingId, setDeletingMeetingId] = useState(null);
    const { user } = useUser();

    const handleTranscriptionClick = (meeting) => {
        setSelectedMeeting(meeting);
        setShowTranscriptionPopup(true);
    };

    const closeTranscriptionPopup = () => {
        setShowTranscriptionPopup(false);
        setSelectedMeeting(null);
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
            } catch (error) {
                console.error('Error deleting meeting:', error);
                toast.error(error?.response?.data?.message || 'Failed to delete meeting');
            } finally {
                setDeletingMeetingId(null);
            }
        }
    };

    return (
        <>
            <div className='px-2 py-4 space-y-8'>
                {console.log("meetings", meetings)}
                {
                    meetings?.map((meeting) => (
                    <Card key={meeting.meeting_id} className='border border-primary bg-white shadow-sm hover:shadow-md transition-all duration-300'>
                        <CardContent className='p-6'>
                            <div className='flex flex-wrap justify-between items-center gap-4'>
                                <div className='flex items-center gap-4'>
                                    <h3 className='text-black text-lg font-medium'>{meeting.created_by == 1 ? 'You created a meeting' : 'You joined a meeting'}</h3>
                                    <Badge className={`py-2 px-4 ${
                                        meeting.isScheduled 
                                            ? (meeting.status === 'SCHEDULED' 
                                                ? "bg-green-500 text-white"
                                                : meeting.status === 'CANCELED'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-yellow-500 text-white')
                                            : (meeting.status === 'PROCESSING'
                                                ? 'bg-blue-500 text-white'
                                                : meeting.status === 'COMPLETED'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-500 text-white')
                                        }`}> 
                                        {meeting.isScheduled ? meeting.status : 
                                            (meeting.status === 'PROCESSING' ? 'READY' : meeting.status)}
                                    </Badge>
                                </div>
                                <div className='flex items-center gap-6'>
                                    <RenderMembers members={meeting.participants} />
                                    <p className='flex items-center gap-2 text-black'><Clock size={16} /> {meeting.duration}min</p>
                                    <time className='font-light text-black text-sm'>{moment(meeting.created_at).format("DD MMM YYYY")}</time>
                                </div>
                            </div>

                            <div className='mt-8 space-y-4'>
                                <div className='space-y-2'>
                                    <h2 className='text-3xl font-semibold text-black'>{meeting.heading}</h2>
                                    <p className='text-black leading-relaxed'>{meeting.description}</p>
                                </div>

                                <div className='flex flex-wrap gap-6 text-black'>
                                    {meeting.isScheduled ? (
                                        <>
                                            <div className='flex items-center gap-2'>
                                                <strong className='text-black'>Scheduled Date:</strong>
                                                <span>{meeting.date ? moment(meeting.date).format('LLL') : 'Not set'}</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <strong className='text-black'>Scheduled Time:</strong>
                                                <span>{meeting.time ? moment(meeting.time).format('LT') : 'Not set'}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className='flex items-center gap-2'>
                                                <strong className='text-black'>Start At:</strong>
                                                <span>{meeting.start_time ? moment(meeting.start_time).format('LLL') : 'Not started yet'}</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <strong className='text-black'>End At:</strong>
                                                <span>{meeting?.end_time ? moment(meeting.end_time).format('LLL') : 'Meeting in progress'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className='mt-6 flex justify-between items-center'>
                                <div className='flex items-center gap-3'>
                                    {!meeting.isScheduled && (
                                        <>
                                            {!meeting.start_time && (
                                                <a
                                                    href={`/meeting/${meeting.meeting_id}`}
                                                    className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2'
                                                >
                                                    <Play className='w-4 h-4' />
                                                    Start Meeting
                                                </a>
                                            )}
                                            {meeting.start_time && !meeting.end_time && (
                                                <a
                                                    href={`/meeting/${meeting.meeting_id}`}
                                                    className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2'
                                                >
                                                    <Play className='w-4 h-4' />
                                                    Join Meeting
                                                </a>
                                            )}
                                            {meeting.end_time && (
                                                <div className='text-gray-600 text-sm font-medium'>
                                                    Meeting Completed
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {meeting.isScheduled && meeting.status === 'PENDING' && (
                                        <div className='text-orange-600 text-sm font-medium'>
                                            Waiting for participants to respond to invitation
                                        </div>
                                    )}
                                    {meeting.isScheduled && meeting.status === 'SCHEDULED' && (
                                        <div className='text-blue-600 text-sm font-medium'>
                                            Meeting Scheduled
                                        </div>
                                    )}
                                </div>
                                
                                <div className='flex items-center gap-3'>
                                    {/* Transcription Button */}
                                    <button
                                        onClick={() => handleTranscriptionClick(meeting)}
                                        className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2'
                                    >
                                        <MessageSquare className='w-4 h-4' />
                                        View Transcriptions
                                    </button>
                                    
                                    {/* Delete Button - Only for Providers */}
                                    {user?.Role === 'PROVIDER' && (
                                        <button
                                            onClick={() => handleDeleteMeeting(meeting.meeting_id)}
                                            disabled={deletingMeetingId === meeting.meeting_id}
                                            className='bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2'
                                        >
                                            <Trash2 className='w-4 h-4' />
                                            {deletingMeetingId === meeting.meeting_id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    )}
                                </div>
                            </div>


                        </CardContent>
                    </Card>
                ))
            }
            </div>
            
            {/* Transcription Popup */}
            <TranscriptionPopup 
                meeting={selectedMeeting}
                isOpen={showTranscriptionPopup}
                onClose={closeTranscriptionPopup}
            />
        </>
    )
}

export default RenderMeeting