"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Clock, Activity, TrendingUp, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Loader from '@/components/Loader';
import dayjs from 'dayjs';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { Button } from '@/components/ui/button';

export default function TimeTrackingAnalyticsPage() {
    const router = useTabNavigation();
    const [timelineView, setTimelineView] = useState('daily');
    const { filteredTimelineData, fetchTimelineData, isLoading: timelineLoading } = useDashboardFilter();

    // Fetch timeline data when component mounts
    useEffect(() => {
        fetchTimelineData();
    }, [fetchTimelineData]);

    // Extract time data
    const timeData = filteredTimelineData?.times || [];

    // Process time data for charts
    const processedTimeData = useMemo(() => {
        if (!Array.isArray(timeData) || timeData.length === 0) return [];

        const timeMap = {};

        timeData.forEach(project => {
            project.Time?.forEach(({ start, end }) => {
                if (!start || !end) return;
                const key = timelineView === 'daily'
                    ? dayjs(start).format('ddd')
                    : timelineView === 'weekly'
                        ? dayjs(start).format('MMM DD')
                        : dayjs(start).format('MMM');
                const dur = (new Date(end) - new Date(start)) / 36e5; // hours

                if (!timeMap[key]) {
                    timeMap[key] = {
                        period: key,
                        total: 0
                    };
                }
                timeMap[key].total += dur;
            });
        });

        return Object.values(timeMap).sort((a, b) =>
            dayjs(a.period, timelineView === 'daily' ? 'ddd' : timelineView === 'weekly' ? 'MMM DD' : 'MMM')
                .isBefore(dayjs(b.period, timelineView === 'daily' ? 'ddd' : timelineView === 'weekly' ? 'MMM DD' : 'MMM')) ? -1 : 1
        );
    }, [timeData, timelineView]);

    // Calculate time summary
    const timeSummary = useMemo(() => {
        if (!Array.isArray(timeData) || timeData.length === 0) {
            return { totalHours: 0, totalEntries: 0, averageHours: 0 };
        }

        let totalHours = 0;
        let totalEntries = 0;

        timeData.forEach(project => {
            if (project && project.Time && Array.isArray(project.Time)) {
                project.Time.forEach(timeEntry => {
                    if (timeEntry && timeEntry.end && timeEntry.start) {
                        totalHours += (new Date(timeEntry.end).getTime() - new Date(timeEntry.start).getTime()) / (1000 * 60 * 60);
                        totalEntries++;
                    }
                });
            }
        });

        return {
            totalHours: Math.round(totalHours * 10) / 10,
            totalEntries,
            averageHours: totalEntries > 0 ? Math.round((totalHours / totalEntries) * 10) / 10 : 0
        };
    }, [timeData]);

    // Detailed time rows
    const detailedRows = useMemo(() => {
        if (!Array.isArray(timeData)) return [];
        return timeData.flatMap(project => {
            return (project.Time || []).map(entry => {
                const start = entry.start;
                const end = entry.end;
                const hours = ((new Date(end) - new Date(start)) / 36e5).toFixed(2);
                return {
                    projectName: project.name,
                    taskName: entry.task?.name || '—',
                    start,
                    end,
                    hours,
                    description: entry.work_description || '—',
                    user: entry.user?.name || 'Unknown'
                };
            });
        });
    }, [timeData]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="mr-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <Clock className="w-6 h-6 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Time Tracking Analytics</h1>
                        </div>
                        <Button
                            onClick={fetchTimelineData}
                            disabled={timelineLoading}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-gray-50"
                        >
                            {timelineLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            ) : (
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            )}
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-6">
                {timelineLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Total Hours</p>
                                        <p className="text-2xl font-bold text-blue-800">{timeSummary.totalHours}</p>
                                    </div>
                                    <Clock className="text-blue-500" size={24} />
                                </div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-600 font-medium">Total Entries</p>
                                        <p className="text-2xl font-bold text-green-800">{timeSummary.totalEntries}</p>
                                    </div>
                                    <Activity className="text-green-500" size={24} />
                                </div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-purple-600 font-medium">Average Hours</p>
                                        <p className="text-2xl font-bold text-purple-800">{timeSummary.averageHours}</p>
                                    </div>
                                    <TrendingUp className="text-purple-500" size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Time Distribution Chart */}
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold">Time Distribution</h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setTimelineView('daily')}
                                        className={`px-3 py-1 text-sm rounded ${timelineView === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        Daily
                                    </button>
                                    <button
                                        onClick={() => setTimelineView('weekly')}
                                        className={`px-3 py-1 text-sm rounded ${timelineView === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        onClick={() => setTimelineView('monthly')}
                                        className={`px-3 py-1 text-sm rounded ${timelineView === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        Monthly
                                    </button>
                                </div>
                            </div>
                            {processedTimeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={processedTimeData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            name="Total Hours"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-gray-500">
                                    No time data available for the selected period
                                </div>
                            )}
                        </div>

                        {/* Detailed Time Breakdown */}
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <h4 className="text-lg font-semibold mb-4">Detailed Time Breakdown</h4>
                            {detailedRows.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-gray-100">
                                                <th className="text-left py-2 px-3">Project</th>
                                                <th className="text-left py-2 px-3">Task</th>
                                                <th className="text-left py-2 px-3">User</th>
                                                <th className="text-left py-2 px-3">Start</th>
                                                <th className="text-left py-2 px-3">End</th>
                                                <th className="text-right py-2 px-3">Hours</th>
                                                <th className="text-left py-2 px-3">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailedRows.map((row, i) => (
                                                <tr key={i} className="border-b hover:bg-gray-50">
                                                    <td className="py-2 px-3">{row.projectName}</td>
                                                    <td className="py-2 px-3">{row.taskName}</td>
                                                    <td className="py-2 px-3">{row.user}</td>
                                                    <td className="py-2 px-3">
                                                        {row.start ? dayjs(row.start).format('MMM DD, YYYY HH:mm') : 'N/A'}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        {row.end ? dayjs(row.end).format('MMM DD, YYYY HH:mm') : 'N/A'}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-medium">{row.hours}h</td>
                                                    <td className="py-2 px-3">{row.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No detailed time entries available
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}










