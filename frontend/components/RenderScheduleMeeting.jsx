


// import React, { useState } from 'react'
// import { Card, CardContent } from './ui/card'
// import RenderMembers from './RenderMembers'
// import moment from 'moment'
// import { Clock } from 'lucide-react'
// import { useUser } from '@/providers/UserProvider'
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table"
// import { Button } from './Button'
// import Link from 'next/link'
// import { Badge } from './ui/badge'
// import { MoreHorizontal, Edit, Trash2, Calendar, Users } from 'lucide-react'
// import { toast } from 'react-toastify'
// import { updateMeetingStatusRequest, deleteMeetingRequest } from '@/lib/http/meeting'

// const RenderScheduleMeeting = ({ meetings, getMeetings }) => {
//     const { user } = useUser();
//     // Local state to track status changes for immediate UI updates
//     const [localMeetingStatuses, setLocalMeetingStatuses] = useState({});

//     const handleStatusUpdate = async (meetingId, newStatus) => {
//         try {
//             // Update local state immediately for instant UI feedback
//             setLocalMeetingStatuses(prev => ({
//                 ...prev,
//                 [meetingId]: newStatus
//             }));

//             await updateMeetingStatusRequest(meetingId, newStatus);
//             toast.success(`Meeting ${newStatus.toLowerCase()} successfully`);

//             // Force refresh the meetings list
//             if (getMeetings) {
//                 await getMeetings();
//             }
//         } catch (error) {
//             // Revert local state if API call fails
//             setLocalMeetingStatuses(prev => {
//                 const newState = { ...prev };
//                 delete newState[meetingId];
//                 return newState;
//             });
//             toast.error(error?.response?.data?.message || 'Failed to update meeting status');
//         }
//     };

//     const handleDeleteMeeting = async (meetingId) => {
//         if (window.confirm('Are you sure you want to delete this meeting?')) {
//             try {
//                 await deleteMeetingRequest(meetingId);
//                 toast.success('Meeting deleted successfully');
//                 // Force refresh the meetings list after deletion
//                 if (getMeetings) {
//                     await getMeetings();
//                 }
//             } catch (error) {
//                 toast.error(error?.response?.data?.message || 'Failed to delete meeting');
//             }
//         }
//     };

//     const getBadgeStyle = (status) => {
//         switch (status) {
//             case 'SCHEDULED':
//                 return 'bg-green-500 hover:bg-green-600';
//             case 'CANCELED':
//                 return 'bg-red-500 hover:bg-red-600';
//             case 'PENDING':
//                 return 'bg-yellow-500 hover:bg-yellow-600';
//             case 'COMPLETED':
//                 return 'bg-blue-500 hover:bg-blue-600';
//             default:
//                 return 'bg-gray-500 hover:bg-gray-600';
//         }
//     };

//     const getStatusText = (status) => {
//         switch (status) {
//             case 'SCHEDULED':
//                 return 'CONFIRMED';
//             case 'CANCELED':
//                 return 'CANCELED';
//             case 'PENDING':
//                 return 'PENDING';
//             case 'COMPLETED':
//                 return 'COMPLETED';
//             default:
//                 return status;
//         }
//     };

//     return (
//         <div className='px-2 py-4 space-y-20 mt-10'>
//             {
//                 meetings?.map((meeting) => {
//                     // Get current status (local override or original)
//                     const currentStatus = localMeetingStatuses[meeting.meeting_id] || meeting.status;

//                     return (
//                         <Card key={meeting.meeting_id} className='border-none shadow-gray-50 hover:shadow-lg transition-shadow'>
//                             <CardContent className='p-6'>
//                                 <div className='flex justify-between items-center mb-4'>
//                                     <div className='flex items-center gap-4'>
//                                         <h3 className='text-gray-700 text-lg font-medium'>
//                                             {meeting.user_id == user?.user_id ? 'You created a meeting' : 'You are participating in a meeting'}
//                                         </h3>
//                                         <Badge className={`py-2 px-4 text-white ${getBadgeStyle(currentStatus)}`}>
//                                             {getStatusText(currentStatus)}
//                                         </Badge>
//                                     </div>
//                                     <div className='flex items-center gap-4'>
//                                         <RenderMembers members={meeting.participants} />
//                                         <time className='text-gray-600 text-md'>{moment(meeting.created_at).format("DD MMM YYYY")}</time>

//                                         {/* Action buttons for meeting creator */}
//                                         {meeting.user_id == user?.user_id && (
//                                             <div className='flex items-center gap-2'>
//                                                 {currentStatus === 'PENDING' && (
//                                                     <>
//                                                         <Button
//                                                             onClick={() => handleStatusUpdate(meeting.meeting_id, 'SCHEDULED')}
//                                                             className='bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm'
//                                                         >
//                                                             Confirm
//                                                         </Button>
//                                                         <Button
//                                                             onClick={() => handleStatusUpdate(meeting.meeting_id, 'CANCELED')}
//                                                             className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm'
//                                                         >
//                                                             Cancel
//                                                         </Button>
//                                                     </>
//                                                 )}
//                                                 {/* Show delete button for all meetings except completed ones */}
//                                                 {currentStatus !== 'COMPLETED' && (
//                                                     <Button
//                                                         onClick={() => handleDeleteMeeting(meeting.meeting_id)}
//                                                         className='bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm'
//                                                     >
//                                                         <Trash2 className='h-4 w-4' />
//                                                     </Button>
//                                                 )}
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>

//                                 <div className='mt-8'>
//                                     <h2 className='text-3xl'>{meeting.heading}</h2>
//                                     <p className='mt-2 text-gray-600'>{meeting.description}</p>
//                                     <p className='flex items-center gap-4 text-gray-600 mt-2'>
//                                         <strong className='text-black'>Scheduled Time:</strong>
//                                         {moment(meeting.date).format("lll")}
//                                     </p>
//                                     {currentStatus == "SCHEDULED" && (
//                                         <Link className={'text-blue-500 my-2 inline-block hover:text-blue-700 underline'} href={`/meeting/${meeting.meeting_id}`}>
//                                             Join Now
//                                         </Link>
//                                     )}
//                                     {currentStatus == "CANCELED" && (
//                                         <p className='text-red-500 my-2 font-medium'>This meeting has been canceled</p>
//                                     )}
//                                 </div>

//                                 <div className="mt-8">
//                                     <Table className="border-collapse border rounded-md">
//                                         <TableHeader className="border-b">
//                                             <TableRow>
//                                                 <TableHead className="border-r last:border-r-0 text-white bg-yellow-600">Name</TableHead>
//                                                 <TableHead className="border-r last:border-r-0 text-white bg-red-600">Opinion</TableHead>
//                                             </TableRow>
//                                         </TableHeader>
//                                         <TableBody className="divide-y">
//                                             {meeting?.participants.map((participant) => (
//                                                 <TableRow key={participant.meeting_participant_id}>
//                                                     <TableCell className='border-r last:border-r-0 cursor-pointer text-gray-600'>
//                                                         {participant.user.name}
//                                                     </TableCell>
//                                                     <TableCell className='border-r last:border-r-0 cursor-pointer text-gray-600'>
//                                                         {participant.vote == "PENDING" ? "NO RESPONSE" : participant.vote}
//                                                     </TableCell>
//                                                 </TableRow>
//                                             ))}
//                                         </TableBody>
//                                     </Table>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     )
//                 })
//             }
//         </div>
//     )
// }

// export default RenderScheduleMeeting




import React, { useState } from 'react'
import { Card, CardContent } from './ui/card'
import RenderMembers from './RenderMembers'
import moment from 'moment'
import { Clock } from 'lucide-react'
import { useUser } from '@/providers/UserProvider'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from './Button'
import Link from 'next/link'
import { Badge } from './ui/badge'
import { MoreHorizontal, Edit, Trash2, Calendar, Users } from 'lucide-react'
import { toast } from 'react-toastify'
import { updateMeetingStatusRequest, deleteMeetingRequest } from '@/lib/http/meeting'

const RenderScheduleMeeting = ({ meetings, getMeetings }) => {
    const { user } = useUser();
    // Local state to track status changes for immediate UI updates
    const [localMeetingStatuses, setLocalMeetingStatuses] = useState({});
    // Local state to track deleted meetings for immediate UI updates
    const [deletedMeetings, setDeletedMeetings] = useState(new Set());

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
        if (window.confirm('Are you sure you want to delete this meeting?')) {
            try {
                // Add to deleted meetings immediately for instant UI feedback
                setDeletedMeetings(prev => new Set([...prev, meetingId]));

                await deleteMeetingRequest(meetingId);
                toast.success('Meeting deleted successfully');

                // Force refresh the meetings list after deletion
                if (getMeetings) {
                    await getMeetings();
                }
            } catch (error) {
                // Remove from deleted meetings if API call fails
                setDeletedMeetings(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(meetingId);
                    return newSet;
                });
                toast.error(error?.response?.data?.message || 'Failed to delete meeting');
            }
        }
    };

    const getBadgeStyle = (status) => {
        switch (status) {
            case 'SCHEDULED':
                return 'bg-green-500 hover:bg-green-600';
            case 'CANCELED':
                return 'bg-red-500 hover:bg-red-600';
            case 'PENDING':
                return 'bg-yellow-500 hover:bg-yellow-600';
            case 'COMPLETED':
                return 'bg-blue-500 hover:bg-blue-600';
            default:
                return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'SCHEDULED':
                return 'CONFIRMED';
            case 'CANCELED':
                return 'CANCELED';
            case 'PENDING':
                return 'PENDING';
            case 'COMPLETED':
                return 'COMPLETED';
            default:
                return status;
        }
    };

    return (
        <div className='px-2 py-4 space-y-20 mt-10'>
            {
                meetings?.filter(meeting => !deletedMeetings.has(meeting.meeting_id)).map((meeting) => {
                    // Get current status (local override or original)
                    const currentStatus = localMeetingStatuses[meeting.meeting_id] || meeting.status;

                    return (
                        <Card key={meeting.meeting_id} className='border-none shadow-gray-50 hover:shadow-lg transition-shadow'>
                            <CardContent className='p-6'>
                                <div className='flex justify-between items-center mb-4'>
                                    <div className='flex items-center gap-4'>
                                        <h3 className='text-gray-700 text-lg font-medium'>
                                            {meeting.user_id == user?.user_id ? 'You created a meeting' : 'You are participating in a meeting'}
                                        </h3>
                                        <Badge className={`py-2 px-4 text-white ${getBadgeStyle(currentStatus)}`}>
                                            {getStatusText(currentStatus)}
                                        </Badge>
                                    </div>
                                    <div className='flex items-center gap-4'>
                                        <RenderMembers members={meeting.participants} />
                                        <time className='text-gray-600 text-md'>{moment(meeting.created_at).format("DD MMM YYYY")}</time>

                                        {/* Action buttons for meeting creator */}
                                        {meeting.user_id == user?.user_id && (
                                            <div className='flex items-center gap-2'>
                                                {currentStatus === 'PENDING' && (
                                                    <>
                                                        <Button
                                                            onClick={() => handleStatusUpdate(meeting.meeting_id, 'SCHEDULED')}
                                                            className='bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm'
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleStatusUpdate(meeting.meeting_id, 'CANCELED')}
                                                            className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm'
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                )}
                                                {/* Show delete button for all meetings except completed ones */}
                                                {currentStatus !== 'COMPLETED' && (
                                                    <Button
                                                        onClick={() => handleDeleteMeeting(meeting.meeting_id)}
                                                        className='bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm'
                                                    >
                                                        <Trash2 className='h-4 w-4' />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className='mt-8'>
                                    <h2 className='text-3xl'>{meeting.heading}</h2>
                                    <p className='mt-2 text-gray-600'>{meeting.description}</p>
                                    <p className='flex items-center gap-4 text-gray-600 mt-2'>
                                        <strong className='text-black'>Scheduled Time:</strong>
                                        {moment(meeting.date).format("lll")}
                                    </p>
                                    {currentStatus == "SCHEDULED" && (
                                        <Link className={'text-blue-500 my-2 inline-block hover:text-blue-700 underline'} href={`/meeting/${meeting.meeting_id}`}>
                                            Join Now
                                        </Link>
                                    )}
                                    {currentStatus == "CANCELED" && (
                                        <p className='text-red-500 my-2 font-medium'>This meeting has been canceled</p>
                                    )}
                                </div>

                                <div className="mt-8">
                                    <Table className="border-collapse border rounded-md">
                                        <TableHeader className="border-b">
                                            <TableRow>
                                                <TableHead className="border-r last:border-r-0 text-white bg-yellow-600">Name</TableHead>
                                                <TableHead className="border-r last:border-r-0 text-white bg-red-600">Opinion</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y">
                                            {meeting?.participants.map((participant) => (
                                                <TableRow key={participant.meeting_participant_id}>
                                                    <TableCell className='border-r last:border-r-0 cursor-pointer text-gray-600'>
                                                        {participant.user.name}
                                                    </TableCell>
                                                    <TableCell className='border-r last:border-r-0 cursor-pointer text-gray-600'>
                                                        {participant.vote == "PENDING" ? "NO RESPONSE" : participant.vote}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })
            }
        </div>
    )
}

export default RenderScheduleMeeting