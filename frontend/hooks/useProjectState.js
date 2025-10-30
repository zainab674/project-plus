import { useState, useCallback, useMemo, useRef } from 'react';
import { getAllProjectComprehensiveRequest } from '../lib/http/project';

// Custom hook for projects and user data management
export const useProjectState = (user, loadUserWithProjects = null) => {
  const [projects, setProjects] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Cache for expensive data processing to avoid recalculations
  const dataCache = useRef({
    teamMembers: null,
    clients: null,
    providers: null,
    tasks: null,
    lastUserDataHash: null
  });

  // Generate a simple hash for user data to detect changes
  const getUserDataHash = useCallback(() => {
    if (!user?.Projects && !user?.Collaboration) return null;
    return JSON.stringify({
      projectsCount: user.Projects?.length || 0,
      collaborationCount: user.Collaboration?.length || 0,
      lastUpdate: Date.now()
    });
  }, [user?.Projects, user?.Collaboration]);

  // Optimized user data loading function
  const loadUserDataIfNeeded = useCallback(async () => {
    if (isLoadingUserData || !loadUserWithProjects) return; // Prevent multiple simultaneous calls or if function not available
    
    // Check if we already have full data
    if (user?.Projects && user.Projects.length > 0) {
      const hasFullData = user.Projects.some(project =>
        project.Members && Array.isArray(project.Members) &&
        project.Clients && Array.isArray(project.Clients)
      );
      if (hasFullData) return; // We already have complete data
    }
    
    setIsLoadingUserData(true);
    try {
      await loadUserWithProjects();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  }, [isLoadingUserData, user?.Projects, loadUserWithProjects]);

  // Fetch all projects - optimized to use cached data when available
  const fetchProjects = useCallback(async () => {
    // If we already have projects data from user context, use it instead of fetching
    if (user?.Projects && user.Projects.length > 0) {
      const userProjects = user.Projects || [];
      const userCollaboration = user.Collaboration || [];
      
      // Convert collaboration data to project format
      const collaboratedProjects = userCollaboration.map(collab => ({
        ...collab.project,
        isCollabrationProject: true
      }));
      
      // Deduplicate projects by project_id to avoid showing the same project twice
      const projectMap = new Map();
      
      // Add user's own projects first
      userProjects.forEach(project => {
        if (project?.project_id) {
          projectMap.set(project.project_id, project);
        }
      });
      
      // Add collaborated projects if not already present
      collaboratedProjects.forEach(project => {
        if (project?.project_id && !projectMap.has(project.project_id)) {
          projectMap.set(project.project_id, project);
        }
      });
      
      const allProjects = Array.from(projectMap.values());
      
      // Only update if projects actually changed (check by IDs to avoid unnecessary updates)
      setProjects(prevProjects => {
        if (prevProjects && prevProjects.length === allProjects.length) {
          const prevIds = new Set(prevProjects.map(p => p.project_id));
          const newIds = new Set(allProjects.map(p => p.project_id));
          if (prevIds.size === newIds.size && [...prevIds].every(id => newIds.has(id))) {
            return prevProjects; // No change, return previous to prevent re-render
          }
        }
        return allProjects;
      });
      return;
    }

    // Only fetch from API if we don't have cached data
    setProjectsLoading(true);
    try {
      const res = await getAllProjectComprehensiveRequest();

      const { projects, collaboratedProjects } = res.data;

      // Deduplicate projects by project_id to avoid showing the same project twice
      const projectMap = new Map();
      
      // Add user's own projects first
      const projectsArray = projects || [];
      projectsArray.forEach(project => {
        if (project?.project_id) {
          projectMap.set(project.project_id, project);
        }
      });
      
      // Add collaborated projects if not already present
      const collaboratedProjectsArray = collaboratedProjects || [];
      collaboratedProjectsArray.forEach(project => {
        if (project?.project_id && !projectMap.has(project.project_id)) {
          projectMap.set(project.project_id, project);
        }
      });
      
      const allProjects = Array.from(projectMap.values());
      
      // Only update if projects actually changed (check by IDs to avoid unnecessary updates)
      setProjects(prevProjects => {
        if (prevProjects && prevProjects.length === allProjects.length) {
          const prevIds = new Set(prevProjects.map(p => p.project_id));
          const newIds = new Set(allProjects.map(p => p.project_id));
          if (prevIds.size === newIds.size && [...prevIds].every(id => newIds.has(id))) {
            return prevProjects; // No change, return previous to prevent re-render
          }
        }
        return allProjects;
      });
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      setProjects(null);
    } finally {
      setProjectsLoading(false);
    }
  }, [user?.Projects, user?.Collaboration]);

  return {
    projects,
    setProjects,
    projectsLoading,
    setProjectsLoading,
    isLoadingUserData,
    setIsLoadingUserData,
    dataCache,
    getUserDataHash,
    loadUserDataIfNeeded,
    fetchProjects,
  };
};
