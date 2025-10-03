import React, { useState, useEffect, useCallback } from 'react';
import { Users, Calendar, Clock, MapPin, FileText, Video, Phone, User, Building, Play } from 'lucide-react';
import { getsMeetingRequest } from '@/lib/http/meeting';
import { useUser } from '@/providers/UserProvider';
import moment from 'moment';
import JoinMeetingButton, { MeetingStatusBadge } from '@/components/JoinMeetingButton';

// Helper function to format dates properly
const formatDate = (timestamp) => {
    if (!timestamp) return 'Invalid date';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper function to transform backend meeting data to frontend format
const transformMeetingData = (meeting) => {
    const isToday = moment(meeting.created_at).isSame(moment(), 'day');
    const isTomorrow = moment(meeting.created_at).isSame(moment().add(1, 'day'), 'day');

    let date = 'Upcoming';
    if (isToday) date = 'Today';
    else if (isTomorrow) date = 'Tomorrow';



    const meetingType = meeting.isScheduled ? 'Scheduled' : 'Immediate';

    const participants = meeting.participants?.map(p => p.user.name) || [];

    return {
        id: meeting.meeting_id,
        title: meeting.heading,
        time: meeting.time ? moment(meeting.time).format('h:mm A') : 'TBD',
        date: date,
        startTime: meeting.start_time || meeting.created_at,
        endTime: meeting.end_time,
        client: participants.length > 0 ? participants[0] : 'Team Meeting',
        type: meeting.isScheduled ? 'Scheduled Meeting' : 'Immediate Meeting',
        attorney: meeting.user?.name || 'Meeting Creator',
        location: meeting.isScheduled ? 'Scheduled' : 'Virtual Meeting',
        duration: meeting.duration ? `${meeting.duration} min` : 'TBD',

        description: meeting.description,
        participants: participants,
        meetingType: meetingType,
        caseNumber: meeting.meeting_id.slice(0, 8).toUpperCase(),
        status: meeting.status,
        isScheduled: meeting.isScheduled,
        meeting_id: meeting.meeting_id
    };
};

const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                    ×
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    </div>
);

const MeetingListModal = ({ onClose, onSelectMeeting, meetings }) => (
    <Modal title="All Meetings" onClose={onClose}>
        <div className="space-y-4">
            {meetings.map((meeting) => (
                <div
                    key={meeting.id}
                    className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => onSelectMeeting(meeting)}
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-800 mb-1">{meeting.title}</h3>
                            <p className="text-sm text-gray-600 font-medium">{meeting.type}</p>
                        </div>
                        <MeetingStatusBadge status={meeting.status} isScheduled={meeting.isScheduled} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                            <Calendar className="mr-2" size={16} />
                            <span>{meeting.date} at {meeting.time}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <Clock className="mr-2" size={16} />
                            <span>{meeting.duration}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <Building className="mr-2" size={16} />
                            <span>{meeting.client}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <User className="mr-2" size={16} />
                            <span>{meeting.attorney}</span>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-700 truncate flex-1 mr-3">{meeting.description}</p>
                            <JoinMeetingButton
                                meetingId={meeting.meeting_id}
                                status={meeting.status}
                                size="small"
                                className="flex-shrink-0"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </Modal>
);

const MeetingDetailModal = ({ meeting, onClose, onBack }) => (
    <Modal title="Meeting Details" onClose={onClose}>
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{meeting.title}</h2>
                        <p className="text-blue-100 text-lg">{meeting.type}</p>
                    </div>

                </div>
            </div>

            {/* Meeting Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Calendar className="mr-2" size={18} />
                            Schedule Information
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Date:</span>
                                <span className="font-medium">{meeting.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Time:</span>
                                <span className="font-medium">{meeting.time}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Start At:</span>
                                <span className="font-medium">{formatDate(meeting.startTime)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">End At:</span>
                                <span className="font-medium">{formatDate(meeting.endTime)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{meeting.duration}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={`font-medium ${meeting.status === 'Confirmed' ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                    {meeting.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <MapPin className="mr-2" size={18} />
                            Location & Type
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Location:</span>
                                <span className="font-medium">{meeting.location}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Meeting Type:</span>
                                <span className="font-medium flex items-center">
                                    {meeting.meetingType === 'Video Call' ? (
                                        <Video className="mr-1" size={14} />
                                    ) : meeting.meetingType === 'Phone Call' ? (
                                        <Phone className="mr-1" size={14} />
                                    ) : (
                                        <Users className="mr-1" size={14} />
                                    )}
                                    {meeting.meetingType}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Building className="mr-2" size={18} />
                            Client Information
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Client:</span>
                                <span className="font-medium">{meeting.client}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Attorney:</span>
                                <span className="font-medium">{meeting.attorney}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Case Number:</span>
                                <span className="font-medium">{meeting.caseNumber}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Users className="mr-2" size={18} />
                            Participants
                        </h3>
                        <div className="space-y-1">
                            {meeting.participants.map((participant, index) => (
                                <div key={index} className="text-sm text-gray-700 flex items-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                    {participant}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <FileText className="mr-2" size={18} />
                    Meeting Description
                </h3>
                <p className="text-gray-700 leading-relaxed">{meeting.description}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                    onClick={onBack}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                    ← Back to Meetings
                </button>
                <div className="space-x-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Edit Meeting
                    </button>
                    <JoinMeetingButton
                        meetingId={meeting.meeting_id}
                        meetingTitle={meeting.title}
                        status={meeting.status}
                        isScheduled={meeting.isScheduled}
                        size="default"
                    />
                    {meeting.isScheduled && meeting.status === 'PENDING' && (
                        <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                            Waiting for participants to respond
                        </div>
                    )}
                </div>
            </div>
        </div>
    </Modal>
);

const LawFirmMeetingSystem = () => {
    const [activeModal, setActiveModal] = useState(null);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();

    const fetchMeetings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getsMeetingRequest();
            const transformedMeetings = res.data.meetings.map(transformMeetingData);
            setMeetings(transformedMeetings);
        } catch (error) {
            console.error('Error fetching meetings:', error);
            setMeetings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchMeetings();
        }
    }, [user, fetchMeetings]);

    const todaysMeetings = meetings.filter(meeting => meeting.date === 'Today');
    const upcomingMeetings = meetings.filter(meeting => meeting.date !== 'Today');

    const handleSelectMeeting = (meeting) => {
        setSelectedMeeting(meeting);
        setActiveModal('meetingDetail');
    };

    const handleBackToList = () => {
        setSelectedMeeting(null);
        setActiveModal('meetingList');
    };

    return (
        <>


            {/* Meeting Summary Box */}
            <div className=" bg-white rounded-lg shadow-lg border-2 border-purple-200 ">


                <div className="px-6 py-4 border-b border-blue-200  bg-purple-300 bg-opacity-70">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <h2 className="text-xl font-semibold text-gray-800">Meetings</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={fetchMeetings}
                                disabled={loading}
                                className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Refresh meetings"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                            <Users className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>


                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white p-4 rounded-lg border border-indigo-100">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ) : meetings.length === 0 ? (
                        <div className="bg-white p-4 rounded-lg border border-indigo-100 text-center">
                            <p className="text-gray-600">No meetings found</p>
                            <p className="text-sm text-gray-500 mt-1">Create your first meeting to get started</p>
                        </div>
                    ) : (
                        <>
                            {/* Today's Meetings */}
                            <div
                                className="bg-white p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 border border-indigo-100"
                                onClick={() => setActiveModal('meetingList')}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="font-medium text-gray-800">Today's Meetings</span>
                                        <p className="text-sm text-gray-600 mt-1">Active schedule</p>
                                    </div>
                                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        {todaysMeetings.length}
                                    </span>
                                </div>
                            </div>

                            {/* Upcoming Meetings */}
                            <div
                                className="bg-white p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 border border-indigo-100"
                                onClick={() => setActiveModal('meetingList')}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="font-medium text-gray-800">Upcoming Meetings</span>
                                        <p className="text-sm text-gray-600 mt-1">Future schedule</p>
                                    </div>
                                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        {upcomingMeetings.length}
                                    </span>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">

                                <div className="flex justify-between items-center text-sm mt-2">
                                    <span className="text-gray-600">Immediate Meetings:</span>
                                    <span className="font-medium text-blue-600">
                                        {meetings.filter(m => !m.isScheduled).length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm mt-2">
                                    <span className="text-gray-600">Scheduled Meetings:</span>
                                    <span className="font-medium text-green-600">
                                        {meetings.filter(m => m.isScheduled).length}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>





            {/* Modals */}
            {activeModal === 'meetingList' && (
                <MeetingListModal
                    onClose={() => setActiveModal(null)}
                    onSelectMeeting={handleSelectMeeting}
                    meetings={meetings}
                />
            )}

            {activeModal === 'meetingDetail' && selectedMeeting && (
                <MeetingDetailModal
                    meeting={selectedMeeting}
                    onClose={() => setActiveModal(null)}
                    onBack={handleBackToList}
                />
            )}
        </>
    );
};

export default LawFirmMeetingSystem;