import { useState, useCallback } from 'react';
import { getAllTaskProgressRequest } from '../lib/http/task';

// Custom hook for timeline functionality
export const useTimelineState = () => {
  const [selectedProjectForTimeline, setSelectedProjectForTimeline] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const fetchTimelineData = useCallback(async (projectId) => {
    if (!projectId) return;

    setTimelineLoading(true);
    try {

      // Get current date and format it properly for the API (DD-MM-YYYY)
      const now = new Date();
      const endDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Calculate start date (30 days ago for better coverage)
      const startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];


      // Fetch timeline data using the task progress API
      const res = await getAllTaskProgressRequest(startDate, endDate, null, projectId);
      
      console.log('📊 Timeline API response:', res);

      if (res.data) {
        // The API returns data with progress, times, and documents arrays
        // Check if success flag exists, if not, assume success
        const hasSuccess = res.data.success !== false;
        
        if (hasSuccess) {
          const timelineData = {
            progress: Array.isArray(res.data.progress) ? res.data.progress : [],
            times: Array.isArray(res.data.times) ? res.data.times : [],
            documents: Array.isArray(res.data.documents) ? res.data.documents : []
          };
          console.log('✅ Setting timeline data:', timelineData);
          console.log('Progress items:', timelineData.progress.length);
          console.log('Time entries:', timelineData.times.length);
          console.log('Documents:', timelineData.documents.length);
          setTimelineData(timelineData);
        } else {
          console.warn('⚠️ Timeline API returned error');
          setTimelineData({
            progress: [],
            times: [],
            documents: []
          });
        }
      } else {
        console.warn('⚠️ No data in API response');
        setTimelineData({
          progress: [],
          times: [],
          documents: []
        });
      }
    } catch (error) {
      console.error('❌ Error fetching timeline data:', error);
      setTimelineData({
        progress: [],
        times: [],
        documents: []
      });
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const openLawFirmTimelineModal = useCallback(async (project) => {

    if (!project || !project.project_id) {
      console.error('❌ Invalid project data:', project);
      return { success: false, error: 'Invalid project data. Please try again.' };
    }

    setSelectedProjectForTimeline(project);

    // Fetch timeline data for this specific project
    try {
      await fetchTimelineData(project.project_id);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in openLawFirmTimelineModal:', error);
      return { success: false, error: 'Failed to load timeline data. Please try again.' };
    }
  }, [fetchTimelineData]);

  const closeLawFirmTimelineModal = useCallback(() => {
    setSelectedProjectForTimeline(null);
    setTimelineData(null);
  }, []);

  return {
    selectedProjectForTimeline,
    setSelectedProjectForTimeline,
    timelineData,
    setTimelineData,
    timelineLoading,
    setTimelineLoading,
    fetchTimelineData,
    openLawFirmTimelineModal,
    closeLawFirmTimelineModal,
  };
};
