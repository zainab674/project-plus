"use client"

import React, { useMemo } from 'react';
import { BarChart3, Activity } from 'lucide-react';
import { useTabNavigation } from '@/hooks/useTabNavigation';

const TimeTracking = ({ timelineData, timelineLoading }) => {
    const router = useTabNavigation();

    // Extract time data
    const timeData = timelineData?.times || [];

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

    return (
        <>
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-lg shadow-sm border border-pink-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <BarChart3 className="text-blue-500 mr-2" size={24} />
                        <h2 className="text-xl font-semibold text-gray-800">Time Tracking</h2>
                    </div>
                </div>
                <div
                    className="bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push('/dashboard/time-tracking-analytics')}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">View Time Tracking</span>
                        <Activity className="text-blue-500" size={20} />
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                            <span>Total Hours:</span>
                            <span className="font-semibold text-blue-600">{timeSummary.totalHours}h</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Time Entries:</span>
                            <span className="font-semibold text-gray-700">{timeSummary.totalEntries}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TimeTracking;
