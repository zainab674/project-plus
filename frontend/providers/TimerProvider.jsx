"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserProvider';
import { createTimeRequest, stopTimeRequest } from '@/lib/http/task';
import { toast } from 'react-toastify';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const { user, loadUser, loadUserWithProjects } = useUser();
  const [activeTimer, setActiveTimer] = useState(null);
  const [loadingStart, setLoadingStart] = useState(null);
  const [loadingStop, setLoadingStop] = useState(null);

  // Initialize active timer from user data
  useEffect(() => {
    const initializeTimer = async () => {
      if (user?.Time && Array.isArray(user.Time)) {
        const activeTime = user.Time.find(time => time.status === 'PROCESSING');
        if (activeTime) {
          // If we don't have full user data with projects, load it
          if (!user.Projects && !user.Collaboration && !user.Services) {
            console.log('Loading full user data for timer initialization...');
            await loadUserWithProjects();
            return; // This will trigger the effect again with full data
          }
          
          console.log('Active timer found:', activeTime);
          console.log('User projects data:', user.Projects);
          console.log('User collaboration data:', user.Collaboration);
          console.log('User services data:', user.Services);
          
          // Try to get task name from user's projects data
          let taskName = 'Unknown Task';
          let projectName = 'Unknown Project';
          
          // Look through user's projects to find the task
          if (user.Projects) {
            console.log('Searching in Projects:', user.Projects.length, 'projects');
            for (const project of user.Projects) {
              if (project.Tasks) {
                console.log('Project:', project.name, 'has', project.Tasks.length, 'tasks');
                const task = project.Tasks.find(t => t.task_id === activeTime.task_id);
                if (task) {
                  console.log('Found task in Projects:', task.name);
                  taskName = task.name;
                  projectName = project.name;
                  break;
                }
              }
            }
          }
          
          // Also check collaboration projects
          if (user.Collaboration) {
            console.log('Searching in Collaboration:', user.Collaboration.length, 'collaborations');
            for (const collab of user.Collaboration) {
              if (collab.project && collab.project.Tasks) {
                console.log('Collaboration project:', collab.project.name, 'has', collab.project.Tasks.length, 'tasks');
                const task = collab.project.Tasks.find(t => t.task_id === activeTime.task_id);
                if (task) {
                  console.log('Found task in Collaboration:', task.name);
                  taskName = task.name;
                  projectName = collab.project.name;
                  break;
                }
              }
            }
          }
          
          // Also check services projects
          if (user.Services) {
            console.log('Searching in Services:', user.Services.length, 'services');
            for (const service of user.Services) {
              if (service.project && service.project.Tasks) {
                console.log('Service project:', service.project.name, 'has', service.project.Tasks.length, 'tasks');
                const task = service.project.Tasks.find(t => t.task_id === activeTime.task_id);
                if (task) {
                  console.log('Found task in Services:', task.name);
                  taskName = task.name;
                  projectName = service.project.name;
                  break;
                }
              }
            }
          }

          console.log('Final task name:', taskName, 'for task_id:', activeTime.task_id);

          setActiveTimer({
            time_id: activeTime.time_id,
            task_id: activeTime.task_id,
            project_id: activeTime.project_id || 1, // Default to 1 if not available
            start_time: activeTime.start,
            task_name: taskName,
            project_name: projectName
          });
        } else {
          setActiveTimer(null);
        }
      } else {
        setActiveTimer(null);
      }
    };

    initializeTimer();
  }, [user, loadUserWithProjects]);

  const startTimer = async (taskId, taskName, projectId, projectName) => {
    try {
      setLoadingStart(taskId);
      const res = await createTimeRequest(taskId);
      await loadUserWithProjects();
      
      // Set active timer immediately for better UX
      setActiveTimer({
        time_id: res.data.time_id,
        task_id: taskId,
        project_id: projectId,
        start_time: new Date().toISOString(),
        task_name: taskName,
        project_name: projectName
      });
      
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to start timer');
    } finally {
      setLoadingStart(null);
    }
  };

  const stopTimer = async (description = '') => {
    if (!activeTimer) return;
    
    try {
      setLoadingStop(activeTimer.time_id);
      const formdata = { description };
      const res = await stopTimeRequest(activeTimer.time_id, formdata);
      await loadUserWithProjects();
      
      setActiveTimer(null);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to stop timer');
    } finally {
      setLoadingStop(null);
    }
  };

  const value = {
    activeTimer,
    startTimer,
    stopTimer,
    loadingStart,
    loadingStop
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};
