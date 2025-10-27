"use client";

import { useParams, useSearchParams, usePathname } from 'next/navigation';
import { useTimer } from '@/providers/TimerProvider';
import { useUser } from '@/providers/UserProvider';
import { useCallback, useEffect, useState } from 'react';

export const useContextDetection = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { activeTimer } = useTimer();
  const { user } = useUser();
  const [context, setContext] = useState(null);

  const getCurrentContext = useCallback(() => {
    // Priority 1: Active Timer (most accurate - user is actively working on something)
    if (activeTimer && activeTimer.project_id) {
      return {
        project_id: activeTimer.project_id,
        task_id: activeTimer.task_id || null,
        task_name: activeTimer.task_name || null,
        project_name: activeTimer.project_name || null,
        source: 'timer',
        confidence: 'high'
      };
    }

    // Priority 2: URL Parameters (user is on a specific project page)
    if (params?.id && pathname?.includes('/project/')) {
      const projectId = parseInt(params.id);
      const taskId = searchParams?.get('task') ? parseInt(searchParams.get('task')) : null;
      const clientId = searchParams?.get('client_id') ? parseInt(searchParams.get('client_id')) : null;
      
      return {
        project_id: projectId,
        task_id: taskId,
        client_id: clientId,
        source: 'url',
        confidence: 'high'
      };
    }

    // Priority 3: Last accessed project from localStorage (recent activity)
    try {
      const lastContext = localStorage.getItem('lastContext');
      if (lastContext) {
        const parsed = JSON.parse(lastContext);
        // Only use if it's recent (within last 2 hours)
        if (Date.now() - parsed.timestamp < 7200000) {
          return { 
            ...parsed, 
            source: 'localStorage',
            confidence: 'medium'
          };
        }
      }
    } catch (error) {
      console.warn('Error reading lastContext from localStorage:', error);
    }

    // Priority 4: User's most recent project (fallback)
    if (user?.Projects && user.Projects.length > 0) {
      // Sort by updated_at or created_at to get most recent
      const sortedProjects = [...user.Projects].sort((a, b) => 
        new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      );
      
      return {
        project_id: sortedProjects[0].project_id,
        project_name: sortedProjects[0].name,
        source: 'user_recent',
        confidence: 'low'
      };
    }

    return null;
  }, [params, searchParams, pathname, activeTimer, user]);

  // Update context when dependencies change
  useEffect(() => {
    const currentContext = getCurrentContext();
    setContext(currentContext);
    
    // Update localStorage with current context for future use
    if (currentContext && currentContext.source !== 'localStorage') {
      try {
        localStorage.setItem('lastContext', JSON.stringify({
          ...currentContext,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Error saving context to localStorage:', error);
      }
    }
  }, [getCurrentContext]);

  // Get project details for the current context
  const getProjectDetails = useCallback(() => {
    if (!context || !user?.Projects) return null;
    
    return user.Projects.find(project => 
      project.project_id === context.project_id
    );
  }, [context, user?.Projects]);

  // Get task details for the current context
  const getTaskDetails = useCallback(() => {
    if (!context?.task_id) return null;
    
    const project = getProjectDetails();
    if (!project?.Tasks) return null;
    
    return project.Tasks.find(task => 
      task.task_id === context.task_id
    );
  }, [context, getProjectDetails]);

  // Get available tasks for the current project
  const getAvailableTasks = useCallback(() => {
    const project = getProjectDetails();
    if (!project?.Tasks) return [];
    
    return project.Tasks.map(task => ({
      task_id: task.task_id,
      name: task.name,
      status: task.status,
      assigned_to: task.assigned_to
    }));
  }, [getProjectDetails]);

  // Get project members for the current project
  const getProjectMembers = useCallback(() => {
    const project = getProjectDetails();
    if (!project?.Members) return [];
    
    return project.Members
      .filter(member => member.user_id != null)
      .map(member => ({
        user_id: member.user_id,
        name: member.name,
        email: member.email,
        role: member.role
      }));
  }, [getProjectDetails]);

  // Check if context is valid and recent
  const isContextValid = useCallback(() => {
    if (!context) return false;
    
    // Timer context is always valid while active
    if (context.source === 'timer') return true;
    
    // URL context is valid if we're still on the same page
    if (context.source === 'url') {
      return pathname?.includes(`/project/${context.project_id}`);
    }
    
    // localStorage context is valid if recent
    if (context.source === 'localStorage') {
      return context.timestamp && (Date.now() - context.timestamp < 7200000);
    }
    
    return true;
  }, [context, pathname]);

  return {
    context,
    getCurrentContext,
    getProjectDetails,
    getTaskDetails,
    getAvailableTasks,
    getProjectMembers,
    isContextValid,
    // Helper flags
    hasProject: !!context?.project_id,
    hasTask: !!context?.task_id,
    hasHighConfidence: context?.confidence === 'high'
  };
};
