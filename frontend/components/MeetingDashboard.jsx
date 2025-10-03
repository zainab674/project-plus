import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import moment from 'moment'

const MeetingDashboard = ({ meetings, onCreateMeeting }) => {
    const getMeetingStats = () => {
        const total = meetings?.length || 0
        const pending = meetings?.filter(m => m.status === 'PENDING').length || 0
        const scheduled = meetings?.filter(m => m.status === 'SCHEDULED').length || 0
        const canceled = meetings?.filter(m => m.status === 'CANCELED').length || 0
        const today = meetings?.filter(m => moment(m.date).isSame(moment(), 'day')).length || 0

        return { total, pending, scheduled, canceled, today }
    }

    const stats = getMeetingStats()

    const getUpcomingMeetings = () => {
        return meetings
            ?.filter(m => m.status === 'SCHEDULED' && moment(m.date).isAfter(moment()))
            .sort((a, b) => moment(a.date).diff(moment(b.date)))
            .slice(0, 3) || []
    }

    const upcomingMeetings = getUpcomingMeetings()

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Total Meetings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">
                        All time meetings
                    </p>
                </CardContent>
            </Card>

            {/* Pending Meetings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground">
                        Awaiting confirmation
                    </p>
                </CardContent>
            </Card>

            {/* Scheduled Meetings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.scheduled}</div>
                    <p className="text-xs text-muted-foreground">
                        Confirmed meetings
                    </p>
                </CardContent>
            </Card>

            {/* Today's Meetings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today</CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
                    <p className="text-xs text-muted-foreground">
                        Meetings today
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default MeetingDashboard 