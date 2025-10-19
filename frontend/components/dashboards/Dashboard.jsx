

"use client"

import * as React from "react"
import { useEffect } from "react"

import { getsMeetingRequest } from "@/lib/http/meeting"

import Loader from "@/components/Loader"
import { getPedingDocsRequest } from "@/lib/http/client"
import { getAllTaskProgressRequest } from "@/lib/http/task"
import { getRecentDatesWithLabels } from "@/utils/getRecentDatesWithLabels"
import Todo from './todo';
import LawFirmTimeline from './timeLine';
import TimeEfficiency from './timeEfficiency';
import CreateCase from './createCase';
import LawFirmMeetingSystem from './meetings';
import UnTake from './untake';
import Billing from './billing';
import BusinessStatus from './businessStatus';
import ClientDashboard from './ClientDashboard';
import RecentCases from './recentCases';
import TopNavigation from '../TopNavigation';
import { QuickActions } from '../quickActions';
import { useUser } from "@/providers/UserProvider"
import AILawyerAssistant from '../AILawyerAssistant';
import { DashboardFilterProvider, useDashboardFilter } from '@/providers/DashboardFilterProvider';


// Dashboard Content Component that uses filter context
const DashboardContent = () => {
  const [meeting, setMeeting] = React.useState(null);
  const { user } = useUser();
  const [isLoading, setIsloading] = React.useState(true);
  const [pedingDocs, setPendingDocs] = React.useState([]);
  const [progress, setProgress] = React.useState([]);
  const [dates, setDates] = React.useState(getRecentDatesWithLabels(20));
  const [selectedDate, setSelectedDate] = React.useState(dates[0].date);

  // Get filter context
  const { 
    filteredProjects, 
    filteredTimelineData, 
    isLoading: filterLoading,
    fetchProjects,
    fetchTimelineData,
    error: filterError
  } = useDashboardFilter();

  const getProgress = React.useCallback(async () => {
    try {
      const res = await getAllTaskProgressRequest(selectedDate);
      setProgress(res.data.progress)
      console.log(" setProgress ", res.data.progress)
    } catch (error) {
      console.log(error?.response?.data?.meesage || error?.meesage);
    }
  }, [selectedDate])

  useEffect(() => {
    if (user) {
      setIsloading(false)
    }
  }, [user])

  const getMeetings = React.useCallback(async () => {
    try {
      const res = await getsMeetingRequest(true);
      setMeeting(res.data.meetings[0]);
      console.log(" setMeeting ", res.data.meetings[0])
    } catch (error) {
      console.log(error?.response?.data?.message || error.message);
    }
  }, []);

  // Initialize filter data when component mounts
  React.useEffect(() => {
    fetchProjects();
    fetchTimelineData();
    getMeetings();
  }, [fetchProjects, fetchTimelineData, getMeetings]);

  React.useEffect(() => {
    getProgress();
  }, [selectedDate])

  if (isLoading || filterLoading) {
    return <>
      <div className="h-screen bg-white m-2 rounded-md flex items-center justify-center">
        <Loader />
      </div>
    </>
  }


  return (
    <>
      <TopNavigation />
      <QuickActions />

      {/* Show Client Dashboard for CLIENT role */}
      {user?.Role === 'CLIENT' ? (
        <ClientDashboard />
      ) : (
        <div className="min-h-screen bg-gray-50 p-2">
          <div className="max-w-7xl mx-auto">
            {/* Error Display */}
            {filterError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  <strong>Filter Error:</strong> {filterError}
                </p>
              </div>
            )}

            {user?.Role === 'PROVIDER' && (
              < CreateCase />
            )}
            
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user?.Role !== 'BILLER' && (
                <RecentCases filteredProjects={filteredProjects} />
              )}
              {user?.Role !== 'BILLER' && (
                <Todo filteredProjects={filteredProjects} />
              )}
              {user?.Role !== 'BILLER' && user?.Role !== 'TEAM' && (
                < LawFirmTimeline 
                  timelineData={filteredTimelineData}
                  timelineLoading={filterLoading}
                />
              )}
              {user?.Role === 'PROVIDER' && (
                < TimeEfficiency projectId={undefined} filteredProjects={filteredProjects} />
              )}
              <LawFirmMeetingSystem />
              {user?.Role !== 'TEAM' && (
                <Billing filteredProjects={filteredProjects} />
              )}
              {user?.Role === 'PROVIDER' && (
                <BusinessStatus filteredProjects={filteredProjects} />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* AI Legal Assistant - Floating component for case creation - Only for Provider and Admin */}
      {(user?.Role === 'PROVIDER' || user?.Role === 'ADMIN') && (
        <AILawyerAssistant />
      )}
    </>
  );
};

// Main Dashboard Component with Filter Provider
const Dashboard = () => {
  return (
    <DashboardFilterProvider>
      <DashboardContent />
    </DashboardFilterProvider>
  );
};

export default Dashboard;