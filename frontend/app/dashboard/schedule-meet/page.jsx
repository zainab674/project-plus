"use client"
import { useCallback, useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Info,
    Plus,
    Search,
    Settings,
} from "lucide-react"
import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { constantMeeting } from "@/contstant/contantMeeting"
import RenderScheduleMeeting from "@/components/RenderScheduleMeeting"
import CreateMeeting from "@/components/CreateMeeting"
import { getsMeetingRequest } from "@/lib/http/meeting"
import { useUser } from "@/providers/UserProvider"

export default function Page() {
    const [createMeeting, setCreateMeeting] = useState(false);
    const [meetings, setMeetings] = useState([]);
    const { user } = useUser();

    const getMeetings = useCallback(async () => {
        try {
            const res = await getsMeetingRequest(true);
            setMeetings(res.data.meetings);
        } catch (error) {
            console.log(error?.response?.data?.message || error.message);
        }
    }, []);

    useEffect(() => {
        getMeetings();
    }, [])
    return (
        <>
            <div className="flex h-screen flex-col bg-white m-2 rounded-md overflow-y-auto">
                <div className="flex flex-col gap-4 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold text-black">Schedule Meetings</h1>
                            <Info className="h-4 w-4 text-black" />
                        </div>
                    </div>

                    {/* View Tabs */}
                    <Tabs defaultValue="pending" className="w-full">
                        <div className="flex items-center justify-between">
                            <TabsList className="bg-white border border-primary">
                                <TabsTrigger value="pending" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Pending</TabsTrigger>
                                <TabsTrigger value="canceled" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Canceled</TabsTrigger>
                                <TabsTrigger value="scheduled" className="data-[state=active]:bg-tbutton-bg data-[state=active]:text-tbutton-text">Scheduled</TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-2">
                                <Button
                                    className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                                    onClick={() => setCreateMeeting(true)}
                                >
                                    Schedule Meet
                                </Button>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-black" />
                                    <Input
                                        className="w-64 pl-8 bg-white border-primary text-black placeholder:text-gray-400"
                                        placeholder="Search"
                                    />
                                </div>
                                <Select>
                                    <SelectTrigger className="w-[180px] bg-white border-primary text-black">
                                        <SelectValue placeholder="Select a date" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-primary">
                                        <SelectGroup>
                                            <SelectLabel className="text-gray-400">Today</SelectLabel>
                                            <SelectItem value="apple" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">Yeaterday</SelectItem>
                                            <SelectItem value="banana" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">03-12-2024</SelectItem>
                                            <SelectItem value="blueberry" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">02-12-2024</SelectItem>
                                            <SelectItem value="grapes" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">01-12-2024</SelectItem>
                                            <SelectItem value="pineapple" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">31-11-2024</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <TabsContent value="pending">
                            {
                                meetings?.filter(meeting => meeting.status == "PENDING").length > 0 &&
                                <RenderScheduleMeeting meetings={meetings?.filter(meeting => meeting.status == "PENDING")} />
                            }
                            {
                                meetings?.filter(meeting => meeting.status == "PENDING").length == 0 &&
                                <div className="flex h-[500px] items-center justify-center text-black">
                                    Empty
                                </div>
                            }
                        </TabsContent>
                        <TabsContent value="canceled">
                            {
                                meetings?.filter(meeting => meeting.status == "CANCELED").length > 0 &&
                                <RenderScheduleMeeting meetings={meetings?.filter(meeting => meeting.status == "CANCELED")} />
                            }
                            {
                                meetings?.filter(meeting => meeting.status == "CANCELED").length == 0 &&
                                <div className="flex h-[500px] items-center justify-center text-black">
                                    Empty
                                </div>
                            }
                        </TabsContent>
                        <TabsContent value="scheduled">
                            {
                                meetings?.filter(meeting => meeting.status == "SCHEDULED").length > 0 &&
                                <RenderScheduleMeeting meetings={meetings?.filter(meeting => meeting.status == "SCHEDULED")} />
                            }
                            {
                                meetings?.filter(meeting => meeting.status == "SCHEDULED").length == 0 &&
                                <div className="flex h-[500px] items-center justify-center text-black">
                                    Empty
                                </div>
                            }
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <CreateMeeting open={createMeeting} onClose={() => setCreateMeeting(false)} isScheduled={true} getMeetings={getMeetings} />
        </>
    )
}