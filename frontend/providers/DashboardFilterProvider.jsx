'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { getAllProjectWithTasksRequest } from '@/lib/http/project';
import { getAllTaskProgressRequest } from '@/lib/http/task';

// Extend dayjs with isBetween plugin
dayjs.extend(isBetween);

// Filter action types
const FILTER_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_PROJECTS: 'SET_PROJECTS',
  SET_SELECTED_CASE: 'SET_SELECTED_CASE',
  SET_SELECTED_MONTH_YEAR: 'SET_SELECTED_MONTH_YEAR',
  SET_SELECTED_MONTH_RANGE: 'SET_SELECTED_MONTH_RANGE',
  SET_TIMELINE_DATA: 'SET_TIMELINE_DATA',
  SET_ERROR: 'SET_ERROR',
  RESET_FILTERS: 'RESET_FILTERS',
  SET_AVAILABLE_MONTHS: 'SET_AVAILABLE_MONTHS'
};

// Initial state
const initialState = {
  // Data
  projects: [],
  timelineData: null,
  availableMonths: [],
  
  // Filters
  selectedCase: null,
  selectedMonthYear: null,
  selectedMonthRange: null,
  
  // UI State
  isLoading: false,
  error: null,
  
  // Computed data
  filteredProjects: [],
  filteredTimelineData: null
};

// Reducer function
const filterReducer = (state, action) => {
  switch (action.type) {
    case FILTER_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case FILTER_ACTIONS.SET_PROJECTS:
      return { 
        ...state, 
        projects: action.payload,
        availableMonths: extractAvailableMonths(action.payload)
      };
      
    case FILTER_ACTIONS.SET_SELECTED_CASE:
      return { ...state, selectedCase: action.payload };
      
    case FILTER_ACTIONS.SET_SELECTED_MONTH_YEAR:
      return { ...state, selectedMonthYear: action.payload };
      
    case FILTER_ACTIONS.SET_SELECTED_MONTH_RANGE:
      return { ...state, selectedMonthRange: action.payload };
      
    case FILTER_ACTIONS.SET_TIMELINE_DATA:
      return { ...state, timelineData: action.payload };
      
    case FILTER_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
      
    case FILTER_ACTIONS.RESET_FILTERS:
      return { 
        ...state, 
        selectedCase: null, 
        selectedMonthYear: null,
        selectedMonthRange: null,
        error: null 
      };
      
    case FILTER_ACTIONS.SET_AVAILABLE_MONTHS:
      return { ...state, availableMonths: action.payload };
      
    default:
      return state;
  }
};

// Helper function to extract available months from projects
const extractAvailableMonths = (projects) => {
  if (!Array.isArray(projects)) return [];
  
  const monthSet = new Set();
  projects.forEach(project => {
    if (project.created_at) {
      const monthYear = dayjs(project.created_at).format('MMMM YYYY');
      monthSet.add(monthYear);
    }
  });
  
  return Array.from(monthSet).sort((a, b) => {
    const dateA = dayjs(a, 'MMMM YYYY');
    const dateB = dayjs(b, 'MMMM YYYY');
    return dateB.diff(dateA); // Sort newest first
  });
};

// Context creation
const DashboardFilterContext = createContext();

// Custom hook for using the context
export const useDashboardFilter = () => {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error('useDashboardFilter must be used within a DashboardFilterProvider');
  }
  return context;
};

// Provider component
export const DashboardFilterProvider = ({ children }) => {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  // Memoized filtered projects
  const filteredProjects = useMemo(() => {
    let filtered = state.projects;

    // Filter by selected case
    if (state.selectedCase) {
      filtered = filtered.filter(project => 
        project.project_id === state.selectedCase.project_id
      );
    }

    // Filter by selected month-year (single month)
    if (state.selectedMonthYear) {
      filtered = filtered.filter(project => {
        if (!project.created_at) return false;
        const projectMonthYear = dayjs(project.created_at).format('MMMM YYYY');
        return projectMonthYear === state.selectedMonthYear;
      });
    }

    // Filter by selected month range
    if (state.selectedMonthRange) {
      const fromDate = dayjs(state.selectedMonthRange.from, 'MMMM YYYY').startOf('month');
      const toDate = dayjs(state.selectedMonthRange.to, 'MMMM YYYY').endOf('month');
      
      filtered = filtered.filter(project => {
        if (!project.created_at) return false;
        const projectDate = dayjs(project.created_at);
        return projectDate.isBetween(fromDate, toDate, 'day', '[]');
      });
    }

    return filtered;
  }, [state.projects, state.selectedCase, state.selectedMonthYear, state.selectedMonthRange]);

  // Memoized filtered timeline data
  const filteredTimelineData = useMemo(() => {
    if (!state.timelineData) return null;

   

    const { times, progress, documents } = state.timelineData;
    let filteredTimes = times;
    let filteredProgress = progress;
    let filteredDocuments = documents;

    // Filter by selected case
    if (state.selectedCase) {
      const caseId = state.selectedCase.project_id;
      
      filteredTimes = times.filter(project => project.project_id === caseId);
      filteredProgress = progress.filter(project => project.project_id === caseId);
      filteredDocuments = documents.filter(project => project.project_id === caseId);
    }

    // Filter by selected month-year (single month)
    if (state.selectedMonthYear) {
      const [month, year] = state.selectedMonthYear.split(' ');
      const startOfMonth = dayjs(`${year}-${dayjs().month(month).format('MM')}-01`);
      const endOfMonth = startOfMonth.endOf('month');

      // Filter timeline data by creation date
      filteredTimes = filteredTimes.map(project => ({
        ...project,
        Time: project.Time?.filter(timeEntry => {
          const entryDate = dayjs(timeEntry.created_at);
          return entryDate.isBetween(startOfMonth, endOfMonth, 'day', '[]');
        }) || []
      })).filter(project => project.Time.length > 0);

      filteredProgress = filteredProgress.map(project => ({
        ...project,
        Tasks: project.Tasks?.map(task => ({
          ...task,
          Progress: task.Progress?.filter(progressEntry => {
            const entryDate = dayjs(progressEntry.created_at);
            return entryDate.isBetween(startOfMonth, endOfMonth, 'day', '[]');
          }) || []
        })).filter(task => task.Progress.length > 0) || []
      })).filter(project => project.Tasks.length > 0);

      filteredDocuments = filteredDocuments.map(project => ({
        ...project,
        Clients: project.Clients?.map(client => ({
          ...client,
          Documents: client.Documents?.filter(doc => {
            const docDate = dayjs(doc.created_at);
            return docDate.isBetween(startOfMonth, endOfMonth, 'day', '[]');
          }) || []
        })).filter(client => client.Documents.length > 0) || []
      })).filter(project => project.Clients.length > 0);
    }

    // Filter by selected month range
    if (state.selectedMonthRange) {
      const fromDate = dayjs(state.selectedMonthRange.from, 'MMMM YYYY').startOf('month');
      const toDate = dayjs(state.selectedMonthRange.to, 'MMMM YYYY').endOf('month');

      // Filter timeline data by creation date within range
      filteredTimes = filteredTimes.map(project => ({
        ...project,
        Time: project.Time?.filter(timeEntry => {
          const entryDate = dayjs(timeEntry.created_at);
          return entryDate.isBetween(fromDate, toDate, 'day', '[]');
        }) || []
      })).filter(project => project.Time.length > 0);

      filteredProgress = filteredProgress.map(project => ({
        ...project,
        Tasks: project.Tasks?.map(task => ({
          ...task,
          Progress: task.Progress?.filter(progressEntry => {
            const entryDate = dayjs(progressEntry.created_at);
            return entryDate.isBetween(fromDate, toDate, 'day', '[]');
          }) || []
        })).filter(task => task.Progress.length > 0) || []
      })).filter(project => project.Tasks.length > 0);

      filteredDocuments = filteredDocuments.map(project => ({
        ...project,
        Clients: project.Clients?.map(client => ({
          ...client,
          Documents: client.Documents?.filter(doc => {
            const docDate = dayjs(doc.created_at);
            return docDate.isBetween(fromDate, toDate, 'day', '[]');
          }) || []
        })).filter(client => client.Documents.length > 0) || []
      })).filter(project => project.Clients.length > 0);
    }

   
    return {
      times: filteredTimes,
      progress: filteredProgress,
      documents: filteredDocuments
    };
  }, [state.timelineData, state.selectedCase, state.selectedMonthYear, state.selectedMonthRange]);

  // Action creators
  const setLoading = useCallback((loading) => {
    dispatch({ type: FILTER_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const setProjects = useCallback((projects) => {
    dispatch({ type: FILTER_ACTIONS.SET_PROJECTS, payload: projects });
  }, []);

  const setSelectedCase = useCallback((selectedCase) => {
    dispatch({ type: FILTER_ACTIONS.SET_SELECTED_CASE, payload: selectedCase });
  }, []);

  const setSelectedMonthYear = useCallback((selectedMonthYear) => {
    dispatch({ type: FILTER_ACTIONS.SET_SELECTED_MONTH_YEAR, payload: selectedMonthYear });
  }, []);

  const setSelectedMonthRange = useCallback((selectedMonthRange) => {
    dispatch({ type: FILTER_ACTIONS.SET_SELECTED_MONTH_RANGE, payload: selectedMonthRange });
  }, []);

  const setTimelineData = useCallback((timelineData) => {
    dispatch({ type: FILTER_ACTIONS.SET_TIMELINE_DATA, payload: timelineData });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: FILTER_ACTIONS.SET_ERROR, payload: error });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: FILTER_ACTIONS.RESET_FILTERS });
  }, []);

  // Data fetching functions
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllProjectWithTasksRequest();
      const { projects, collaboratedProjects } = response.data;
      const allProjects = [...projects, ...collaboratedProjects];
      
      setProjects(allProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error?.response?.data?.message || error?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProjects]);

  const fetchTimelineData = useCallback(async (dateRange = null) => {
    try {
      setLoading(true);
      setError(null);

      // Use provided date range or default to last 6 days
      const startDate = dateRange?.start || dayjs().subtract(6, 'day').format('YYYY-MM-DD');
      const endDate = dateRange?.end || dayjs().format('YYYY-MM-DD');
      
      // Get project ID for filtering if a case is selected
      const projectId = state.selectedCase?.project_id || null;

   
      const response = await getAllTaskProgressRequest(startDate, endDate, null, projectId);
      
      setTimelineData(response.data);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      setError(error?.response?.data?.message || error?.message || 'Failed to fetch timeline data');
    } finally {
      setLoading(false);
    }
  }, [state.selectedCase, state.selectedMonthYear, state.selectedMonthRange, setLoading, setError, setTimelineData]);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Refetch timeline data when filters change
  useEffect(() => {
    if (state.projects.length > 0) {
      fetchTimelineData();
    }
  }, [state.selectedCase, state.selectedMonthYear, state.selectedMonthRange, fetchTimelineData]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return state.selectedCase !== null || state.selectedMonthYear !== null || state.selectedMonthRange !== null;
  }, [state.selectedCase, state.selectedMonthYear, state.selectedMonthRange]);

  const activeCasesCount = useMemo(() => {
    return state.projects.filter(project => project.status === 'Active').length;
  }, [state.projects]);

  const filteredCasesCount = useMemo(() => {
    return filteredProjects.filter(project => project.status === 'Active').length;
  }, [filteredProjects]);

  // Context value
  const contextValue = useMemo(() => ({
    // State
    ...state,
    filteredProjects,
    filteredTimelineData,
    
    // Computed values
    hasActiveFilters,
    activeCasesCount,
    filteredCasesCount,
    
    // Actions
    setSelectedCase,
    setSelectedMonthYear,
    setSelectedMonthRange,
    resetFilters,
    fetchProjects,
    fetchTimelineData,
    setError
  }), [
    state,
    filteredProjects,
    filteredTimelineData,
    hasActiveFilters,
    activeCasesCount,
    filteredCasesCount,
    setSelectedCase,
    setSelectedMonthYear,
    setSelectedMonthRange,
    resetFilters,
    fetchProjects,
    fetchTimelineData,
    setError
  ]);

  return (
    <DashboardFilterContext.Provider value={contextValue}>
      {children}
    </DashboardFilterContext.Provider>
  );
};

export default DashboardFilterProvider;
