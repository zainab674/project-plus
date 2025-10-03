

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
import TopNavigation from '../TopNavigation';
import { QuickActions } from '../quickActions';
import { useUser } from "@/providers/UserProvider"
import AILawyerAssistant from '../AILawyerAssistant';


const Dashboard = () => {

  const [projects, setProjects] = React.useState([]);
  const [meeting, setMeeting] = React.useState(null);
  const { user } = useUser();
  const [isLoading, setIsloading] = React.useState(true);
  const [pedingDocs, setPendingDocs] = React.useState([]);
  const [progress, setProgress] = React.useState([]);
  const [dates, setDates] = React.useState(getRecentDatesWithLabels(20));
  const [selectedDate, setSelectedDate] = React.useState(dates[0].date);


  const getProgress = React.useCallback(async () => {
    try {
      const res = await getAllTaskProgressRequest(selectedDate);
      setProgress(res.data.progress)
      console.log(" setProgress ", res.data.progress)
    } catch (error) {
      console.log(error?.response?.data?.meesage || error?.meesage);
    }
  }, [selectedDate])

  // const getProjectAllProject = React.useCallback(async () => {
  //   setIsloading(true)
  //   try {
  //     const [res, res2] = await Promise.all([getAllProjectRequest(), getPedingDocsRequest()]);
  //     const { projects, collaboratedProjects } = res.data;
  //     setProjects([...projects, ...collaboratedProjects]);
  //     setPendingDocs(res2.data);
  //     console.log(" setPendingDocs ", res2.data)

  //   } catch (error) {
  //     setProjects(null);
  //     console.log(error?.response?.data?.meesage || error?.meesage);
  //   } finally {
  //     setIsloading(false)
  //   }
  // }, []);

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

  React.useEffect(() => {
    // getProjectAllProject();
    getMeetings();
  }, []);

  React.useEffect(() => {
    getProgress();
  }, [selectedDate])

  if (isLoading) {
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
            {user?.Role === 'PROVIDER' && (
              < CreateCase />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user?.Role !== 'BILLER' && (
                <Todo />
              )}
              {user?.Role !== 'BILLER' && user?.Role !== 'TEAM' && (
                < LawFirmTimeline />
              )}
              {user?.Role === 'PROVIDER' && (
                < TimeEfficiency projectId={undefined} />
              )}
              <LawFirmMeetingSystem />
              {user?.Role !== 'TEAM' && (
                <Billing />
              )}
              {user?.Role === 'PROVIDER' && (
                <BusinessStatus />
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

export default Dashboard;