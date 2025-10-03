import React from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from './ui/card';

const graphData = [
    { name: "Today", mails: 4000, comments: 2400,meetings: 2000,transcribtions: 300 },
    { name: "Yeaterday", mails: 3000, comments: 1398,meetings: 1000,transcribtions: 30 },
    { name: "03-12-2024", mails: 2000, comments: 9800,meetings: 1100,transcribtions: 50 },
    { name: "02-12-2024", mails: 2780, comments: 3908,meetings: 1200,transcribtions: 120 },
    { name: "01-12-2024", mails: 1890, comments: 4800,meetings: 900,transcribtions: 400 },
    { name: "31-11-2024", mails: 2390, comments: 3800,meetings: 50,transcribtions: 10 },
];
const timeRanges = ["Last 6 months", "Last 3 months", "Last month"];

const RenderChart = () => {
    return (
        <div className="h-80 mt-8 bg-gray-100 rounded-md shadow-md border border-gray-50">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={graphData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#3A3D41" />
                    <XAxis dataKey="name" stroke="#c2410c" />
                    <YAxis stroke="#28a745" />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#3A3D41", border: "none" }}
                        labelStyle={{ color: "#FCAD06" }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="mails"
                        stroke="#9333ea"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="comments"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="meetings"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="transcribtions"
                        stroke="#eab308"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default RenderChart