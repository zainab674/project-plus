"use client"

import React from 'react';
import TimeTracking from './TimeTracking';
import CaseWorkflowDashboard from './CaseWorkflowDashboard';

const TimeTrackingAndWorkflow = ({ timelineData, timelineLoading }) => {
    return (
        <div className="flex flex-col gap-6">
            <TimeTracking 
                timelineData={timelineData}
                timelineLoading={timelineLoading}
            />
            <CaseWorkflowDashboard />
        </div>
    );
};

export default TimeTrackingAndWorkflow;










