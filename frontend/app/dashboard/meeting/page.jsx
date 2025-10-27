"use client"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Info,
    Plus,
    Search,
    Settings,
} from "lucide-react"
import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import RenderMeeting from "@/components/RenderMeeting"
import RenderScheduleMeeting from "@/components/RenderScheduleMeeting"
import CreateMeeting from "@/components/CreateMeeting"
import { getsMeetingRequest } from "@/lib/http/meeting"
import { useUser } from "@/providers/UserProvider"
import CreateMeetingClient from "@/components/CreateMeetingClient"

export default function Page() {
    const [createMeeting, setCreateMeeting] = useState(false);
    const [createMeetingClient, setCreateMeetingClient] = useState(false);
    const [createScheduledMeeting, setCreateScheduledMeeting] = useState(false);
    const [createScheduledMeetingClient, setCreateScheduledMeetingClient] = useState(false);
    const [meetings, setMeetings] = useState([]);
    const [scheduledMeetings, setScheduledMeetings] = useState([]);
    const { user } = useUser();

    const getMeetings = useCallback(async () => {
        try {
            const res = await getsMeetingRequest(false);
            setMeetings(res.data.meetings);
        } catch (error) {
        }
    }, []);

    const getScheduledMeetings = useCallback(async () => {
        try {
            const res = await getsMeetingRequest(true);
            setScheduledMeetings(res.data.meetings);
        } catch (error) {
        }
    }, []);

    const handleMeetingDeleted = useCallback((deletedMeetingId) => {
        setMeetings(prevMeetings => 
            prevMeetings.filter(meeting => meeting.meeting_id !== deletedMeetingId)
        );
        setScheduledMeetings(prevScheduledMeetings => 
            prevScheduledMeetings.filter(meeting => meeting.meeting_id !== deletedMeetingId)
        );
    }, []);

    useEffect(() => {
        getMeetings();
        getScheduledMeetings();
    }, [getMeetings, getScheduledMeetings]);

    return (
        <>
            <div className="flex h-screen flex-col bg-white m-2 rounded-md overflow-y-auto">
                <div className="flex flex-col gap-4 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold text-black">Meetings</h1>
                            <Info className="h-4 w-4 text-black" />
                        </div>
                    </div>

                    {/* View Tabs */}
                    <Tabs defaultValue="instant" className="w-full">
                        <div className="flex items-center justify-between">
                            <TabsList className="bg-white border border-primary">
                                <TabsTrigger value="instant" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Instant Meetings</TabsTrigger>
                                <TabsTrigger value="scheduled" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Scheduled Meetings</TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-2">
                                {
                                    (user?.Role === "PROVIDER" || user?.Role === "TEAM") &&
                                    <>
                                        <Button className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all" onClick={() => setCreateMeeting(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            New Instant Meeting
                                        </Button>
                                        <Button className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all" onClick={() => setCreateMeetingClient(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            New Client Meeting
                                        </Button>
                                    </>
                                }
                                <Select>
                                    <SelectTrigger className="w-[180px] bg-white border-primary text-black">
                                        <SelectValue placeholder="Select a date" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-primary">
                                        <SelectGroup>
                                            <SelectLabel className="text-black">Today</SelectLabel>
                                            <SelectItem value="apple" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">Yesterday</SelectItem>
                                            <SelectItem value="banana" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">03-12-2024</SelectItem>
                                            <SelectItem value="blueberry" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">02-12-2024</SelectItem>
                                            <SelectItem value="grapes" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">01-12-2024</SelectItem>
                                            <SelectItem value="pineapple" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">31-11-2024</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <TabsContent value="instant">
                            {
                                meetings.length > 0 &&
                                <RenderMeeting meetings={meetings} onMeetingDeleted={handleMeetingDeleted} />
                            }
                            {
                                meetings.length == 0 &&
                                <div className="flex flex-col h-[500px] items-center justify-center text-black gap-4">
                                    <p>No instant meetings</p>
                                    {user?.Role === "PROVIDER" && (
                                        <Button 
                                            className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                                            onClick={() => setCreateMeeting(true)}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add new instant meeting
                                        </Button>
                                    )}
                                </div>
                            }
                        </TabsContent>

                        <TabsContent value="scheduled">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-black">Scheduled Meetings</h3>
                                    <Info className="h-4 w-4 text-black" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {(user?.Role === "PROVIDER" || user?.Role === "TEAM") && (
                                        <>
                                            <Button
                                                className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                                                onClick={() => setCreateScheduledMeeting(true)}
                                            >
                                                Schedule Team Meeting
                                            </Button>
                                            <Button
                                                className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                                                onClick={() => setCreateScheduledMeetingClient(true)}
                                            >
                                                Schedule Client Meeting
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Tabs defaultValue="pending" className="w-full">
                                <TabsList className="bg-white border border-primary mb-4">
                                    <TabsTrigger value="pending" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Pending</TabsTrigger>
                                    <TabsTrigger value="scheduled" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Scheduled</TabsTrigger>
                                    <TabsTrigger value="canceled" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Canceled</TabsTrigger>
                                </TabsList>

                                <TabsContent value="pending">
                                    {
                                        scheduledMeetings?.filter(meeting => meeting.status == "PENDING").length > 0 &&
                                        <RenderScheduleMeeting 
                                            meetings={scheduledMeetings?.filter(meeting => meeting.status == "PENDING")} 
                                            getMeetings={getScheduledMeetings}
                                            onMeetingDeleted={handleMeetingDeleted}
                                        />
                                    }
                                    {
                                        scheduledMeetings?.filter(meeting => meeting.status == "PENDING").length == 0 &&
                                        <div className="flex h-[500px] items-center justify-center text-black">
                                            No pending meetings
                                        </div>
                                    }
                                </TabsContent>

                                <TabsContent value="scheduled">
                                    {
                                        scheduledMeetings?.filter(meeting => meeting.status == "SCHEDULED").length > 0 &&
                                        <RenderScheduleMeeting 
                                            meetings={scheduledMeetings?.filter(meeting => meeting.status == "SCHEDULED")} 
                                            getMeetings={getScheduledMeetings}
                                            onMeetingDeleted={handleMeetingDeleted}
                                        />
                                    }
                                    {
                                        scheduledMeetings?.filter(meeting => meeting.status == "SCHEDULED").length == 0 &&
                                        <div className="flex h-[500px] items-center justify-center text-black">
                                            No scheduled meetings
                                        </div>
                                    }
                                </TabsContent>

                                <TabsContent value="canceled">
                                    {
                                        scheduledMeetings?.filter(meeting => meeting.status == "CANCELED").length > 0 &&
                                        <RenderScheduleMeeting 
                                            meetings={scheduledMeetings?.filter(meeting => meeting.status == "CANCELED")} 
                                            getMeetings={getScheduledMeetings}
                                            onMeetingDeleted={handleMeetingDeleted}
                                        />
                                    }
                                    {
                                        scheduledMeetings?.filter(meeting => meeting.status == "CANCELED").length == 0 &&
                                        <div className="flex h-[500px] items-center justify-center text-black">
                                            No canceled meetings
                                        </div>
                                    }
                                </TabsContent>
                            </Tabs>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <CreateMeeting open={createMeeting} onClose={() => setCreateMeeting(false)} isScheduled={false} getMeetings={getMeetings} project_id={null} />
            <CreateMeetingClient open={createMeetingClient} onClose={() => setCreateMeetingClient(false)} isScheduled={false} getMeetings={getMeetings} project_id={null} />
            
            {/* Scheduled Meeting Creation Modals */}
            <CreateMeeting open={createScheduledMeeting} onClose={() => setCreateScheduledMeeting(false)} isScheduled={true} getMeetings={getScheduledMeetings} project_id={null} />
            <CreateMeetingClient open={createScheduledMeetingClient} onClose={() => setCreateScheduledMeetingClient(false)} isScheduled={true} getMeetings={getScheduledMeetings} project_id={null} />
        </>
    )
}