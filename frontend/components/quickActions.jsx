"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../providers/UserProvider';
import { toast } from 'sonner';

// Import custom hooks
import { useModalState } from '../hooks/useModalState';
import { useMailState } from '../hooks/useMailState';
import { useTimelineState } from '../hooks/useTimelineState';
import { useChatState } from '../hooks/useChatState';
import { useProjectState } from '../hooks/useProjectState';
import { useSendMailState } from '../hooks/useSendMailState';
import { useNotificationState } from '../hooks/useNotificationState';
import { useDashboardFilter } from '../providers/DashboardFilterProvider';

// Import components
import { QuickActionsContent } from './QuickActionsContent';
import { TimelineCasesModal } from './modals/TimelineCasesModal';
import { LawFirmTimelineModal } from './modals/LawFirmTimelineModal';
import { EnhancedMailModal } from './modals/EnhancedMailModal';
import CaseModal from './modals/caseModal';
import AddTaskModal from './modals/AddTaskModal';
import MeetingModal from './modals/meetingModel';
import BillerModal from './modals/BillerModal';
import FlowchartModal from './modals/FlowchartModal';
import TimerModal from './modals/TimerModal';
import NotesModal from './modals/notesModal';
import { useContextDetection } from '@/hooks/useContextDetection';

// Import icons
import {
  Calendar,
  Mail,
  MessageCircle,
  Users,
  Clock,
  BarChart3,
  Briefcase,
  CheckCircle,
  Plus,
  FileText,
  GitCompare,
  GitBranch,
  Phone,
  FileSignature,
  DollarSign,
  X,
  Building,
  User,
  StickyNote,
  MessageSquare,
  Brain,
} from 'lucide-react';

const QuickActions = ({ children, isSidebarMode, setIsSidebarMode }) => {
  const router = useRouter();
  const { user, loadUserWithProjects } = useUser();
  
  // Get context for project detection
  const {
    context,
    getProjectDetails,
    getTaskDetails,
    hasProject,
  } = useContextDetection();
  
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Use custom hooks
  const modalState = useModalState();
  const mailState = useMailState();
  const timelineState = useTimelineState();
  const chatState = useChatState();
  const projectState = useProjectState(user, loadUserWithProjects || (() => Promise.resolve()));
  const sendMailState = useSendMailState();
  const notificationState = useNotificationState();

  // Filtered projects for timeline modal
  const filteredProjects = useMemo(() => {
    if (!projectState.projects || !searchTerm) return projectState.projects;
    return projectState.projects.filter(project =>
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projectState.projects, searchTerm]);

  // Optimized loading states
  const isAnyModalLoading = useMemo(() => {
    return projectState.projectsLoading || mailState.mailLoading || timelineState.timelineLoading || sendMailState.sendMailDataLoading || projectState.isLoadingUserData;
  }, [projectState.projectsLoading, mailState.mailLoading, timelineState.timelineLoading, sendMailState.sendMailDataLoading, projectState.isLoadingUserData]);

  // Enhanced modal handlers with loading states
  const openFlowchartModal = useCallback(() => {
    modalState.openFlowchartModal();
    projectState.fetchProjects();
  }, [modalState, projectState]);

  const openTimelineCasesModal = useCallback(() => {
    modalState.openTimelineCasesModal();
    projectState.fetchProjects();
  }, [modalState, projectState]);

  const openEnhancedMailModal = useCallback(async () => {
    modalState.openEnhancedMailModal();
    try {
      await mailState.fetchMails();
    } catch (error) {
      console.error('Error loading mail data:', error);
    }
  }, [modalState, mailState]);

  const openLawFirmTimelineModal = useCallback(async (project) => {
    const result = await timelineState.openLawFirmTimelineModal(project);
    if (result.success) {
      modalState.openLawFirmTimelineModal();
    } else {
      toast.error(result.error);
    }
  }, [timelineState, modalState]);


  // Close handlers with cleanup
  const closeFlowchartModal = useCallback(() => {
    modalState.closeFlowchartModal();
    setSearchTerm('');
    timelineState.setSelectedProjectForTimeline(null);
  }, [modalState, timelineState]);

  const closeTimelineCasesModal = useCallback(() => {
    modalState.closeTimelineCasesModal();
    setSearchTerm('');
    timelineState.setSelectedProjectForTimeline(null);
    timelineState.setTimelineData(null);
  }, [modalState, timelineState]);

  const closeLawFirmTimelineModal = useCallback(() => {
    modalState.closeLawFirmTimelineModal();
    timelineState.closeLawFirmTimelineModal();
  }, [modalState, timelineState]);

  const closeEnhancedMailModal = useCallback(() => {
    modalState.closeEnhancedMailModal();
    mailState.setSelectedMail(null);
  }, [modalState, mailState]);

  // Selected project state for Meetings modals
  const [selectedMeetingProject, setSelectedMeetingProject] = useState(null);
  
  // Get filter context
  const { selectedCase } = useDashboardFilter();

  // Enhanced chat page navigation
  const openEnhancedChatModal = useCallback(() => {
    router.push('/dashboard/private-chat');
  }, [router]);

  // Internal Chat handlers
  const openInternalChatModal = useCallback(() => {
    // Navigate to chat page - it will auto-detect project from context or show general chat
    if (selectedCase?.project_id) {
      // If specific project selected, go to project chat page
      router.push(`/dashboard/project/${selectedCase.project_id}/chat`);
    } else {
      // Navigate to general chat page - it will auto-detect from context (timer, URL, etc.)
      router.push('/dashboard/chat');
    }
  }, [selectedCase, router]);


  // Define all available actions (after functions are defined)
  const allActions = [
    { name: 'Dashboard', icon: BarChart3, route: '/dashboard', color: 'bg-slate-200' },
    { name: 'Cases', icon: Briefcase, route: '/dashboard/cases', color: 'bg-purple-200' },
    { name: 'Add Task', icon: Plus, route: '/dashboard/tasks/add', color: 'bg-blue-200' },
    { name: 'Timer', icon: Clock, route: '', color: 'bg-green-200', action: modalState.openTimerModal },
    { name: 'TimeLine', icon: Clock, route: '/dashboard/timeline', color: 'bg-orange-200' },
    { name: 'Meeting', icon: Calendar, route: '/dashboard/meeting', color: 'bg-pink-200' },
    { name: 'Mail', icon: Mail, route: '', color: 'bg-red-200', action: modalState.openEnhancedMailModal },
    { name: 'Chat', icon: MessageCircle, route: '', color: 'bg-yellow-200', action: openEnhancedChatModal },
    { name: 'Notes', icon: StickyNote, route: '', color: 'bg-emerald-200', action: modalState.openNotesModal },
    { name: 'Project Chat', icon: MessageSquare, route: '', color: 'bg-blue-200', action: openInternalChatModal },
    { name: 'Team', icon: Users, route: '/dashboard/team', color: 'bg-emerald-200' },
    { name: 'TemplateDocs', icon: FileText, route: '/dashboard/create-document/1', color: 'bg-indigo-200' },
    { name: 'CompareDocs', icon: GitCompare, route: '/ai-legal-doc', color: 'bg-violet-200' },
    { name: 'Flowchart', icon: GitBranch, route: '/dashboard/flowchart', color: 'bg-cyan-200' },
    { name: 'Phone', icon: Phone, route: '/dashboard/phone', color: 'bg-teal-200' },
    { name: 'InviteBiller', icon: DollarSign, route: '/dashboard/invite-biller', color: 'bg-green-200' },
    { name: 'AssignToBiller', icon: Briefcase, route: '/dashboard/case-assignment', color: 'bg-indigo-200' },
    { name: 'AI Assistant', icon: Brain, route: '/dashboard/ai-assistant', color: 'bg-green-500', isAIAssistant: true },
  ];

  // Filter actions based on user role
  const quickActions = useMemo(() => {
    if (user?.Role === 'BILLER') {
      return allActions.filter(action =>
        ['Dashboard', 'Meeting', 'Mail', 'Chat'].includes(action.name)
      );
    } else if (user?.Role === 'CLIENT') {
      const clientActions = allActions.filter(action =>
        ['Dashboard', 'Meeting', 'Mail', 'Chat'].includes(action.name)
      );
      clientActions.push(
        { name: 'My Signatures', icon: FileSignature, route: '/dashboard/client-signatures-simple', color: 'bg-purple-200' }
      );
      return clientActions;
    } else if (user?.Role === 'TEAM' || user?.Role === 'PROVIDER') {
      // Show all actions including AI Assistant for TEAM and PROVIDER
      return allActions;
    } else if (user?.Role === 'ADMIN') {
      // Show all actions including AI Assistant for ADMIN
      return allActions;
    } else {
      // For other roles, filter out AI Assistant and Phone System
      return allActions.filter(action => 
        action.name !== 'Phone System' && action.name !== 'AI Assistant'
      );
    }
  }, [user?.Role, allActions]);

  // Wrapper for meeting modal
  const openMeetingModalWithFilter = useCallback(() => {
    // If a specific case is selected, use it; otherwise, clear selection to show dropdown
    setSelectedMeetingProject(selectedCase);
    modalState.openMeetingModal();
  }, [selectedCase, modalState]);

  const closeMeetingModalWithCleanup = useCallback(() => {
    modalState.closeMeetingModal();
    setSelectedMeetingProject(null);
  }, [modalState]);

  // Modal functions object to pass to QuickActionsContent
  const modalFunctions = {
    openCasesModal: modalState.openCasesModal,
    openAddTaskModal: modalState.openAddTaskModal,
    openEnhancedChatModal: openEnhancedChatModal,
    openTimelineCasesModal: openTimelineCasesModal,
    openFlowchartModal: openFlowchartModal,
    openMeetingModal: openMeetingModalWithFilter,
    openEnhancedMailModal: openEnhancedMailModal,
    openBillerModal: modalState.openBillerModal,
    openInternalChatModal: openInternalChatModal,
    openTimerModal: modalState.openTimerModal,
    openNotesModal: modalState.openNotesModal,
  };

  // If sidebar mode, return sidebar layout with children
  if (isSidebarMode) {
    return (
      <>
        <div className="fixed top-16 left-0 right-0 bottom-0 flex bg-gray-50">
          {/* Left Sidebar */}
          <div className="w-56 bg-white shadow-lg border-r border-gray-200 flex-shrink-0 z-40">
            <QuickActionsContent 
              user={user}
              allActions={allActions}
              quickActions={quickActions}
              isSidebarMode={isSidebarMode}
              modalFunctions={modalFunctions}
            />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto bg-white relative">
            {children}
          </div>
        </div>

        {/* Timeline Cases Modal */}
        <TimelineCasesModal
          isOpen={modalState.isTimelineCasesModalOpen}
          onClose={closeTimelineCasesModal}
          projects={projectState.projects || []}
          projectsLoading={projectState.projectsLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredProjects={filteredProjects}
          onProjectSelect={openLawFirmTimelineModal}
        />

        {/* Law Firm Timeline Modal */}
        <LawFirmTimelineModal
          isOpen={modalState.isLawFirmTimelineModalOpen}
          onClose={closeLawFirmTimelineModal}
          selectedProject={timelineState.selectedProjectForTimeline}
          timelineData={timelineState.timelineData}
          timelineLoading={timelineState.timelineLoading}
          onRefresh={timelineState.fetchTimelineData}
        />

        {/* Enhanced Mail Modal */}
        <EnhancedMailModal
          isOpen={modalState.isEnhancedMailModalOpen}
          onClose={closeEnhancedMailModal}
          mails={mailState.mails}
          mailLoading={mailState.mailLoading}
          selectedMail={mailState.selectedMail}
          setSelectedMail={mailState.setSelectedMail}
          onNewMail={modalState.openSendMailModal}
          onLoadMore={mailState.loadMoreMails}
        />

        {/* Case Modal */}
        <CaseModal
          isOpen={modalState.isCaseModalOpen}
          onClose={modalState.closeCasesModal}
        />

        {/* Add Task Modal */}
        <AddTaskModal
          open={modalState.isAddTaskModalOpen}
          onClose={modalState.closeAddTaskModal}
        />

        {/* Meeting Modal */}
        <MeetingModal
          isOpen={modalState.isMeetingModalOpen}
          onClose={closeMeetingModalWithCleanup}
          selectedProject={selectedMeetingProject}
        />

        {/* Biller Modal */}
        <BillerModal
          isOpen={modalState.isBillerModalOpen}
          onClose={modalState.closeBillerModal}
        />


        {/* Flowchart Modal */}
        <FlowchartModal
          isOpen={modalState.isFlowchartModalOpen}
          onClose={modalState.closeFlowchartModal}
          projects={projectState.projects || []}
          projectsLoading={projectState.projectsLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedProjectForTimeline={timelineState.selectedProjectForTimeline}
          setSelectedProjectForTimeline={timelineState.setSelectedProjectForTimeline}
        />

      </>
    );
  }

  // If horizontal mode, return normal layout
  return (
    <>
      <div className="sticky top-16 z-[35] bg-white">
        <QuickActionsContent 
          user={user}
          allActions={allActions}
          quickActions={quickActions}
          isSidebarMode={isSidebarMode}
          modalFunctions={modalFunctions}
        />
      </div>
      {children}

      {/* Timeline Cases Modal */}
      <TimelineCasesModal
        isOpen={modalState.isTimelineCasesModalOpen}
        onClose={closeTimelineCasesModal}
        projects={projectState.projects || []}
        projectsLoading={projectState.projectsLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredProjects={filteredProjects}
        onProjectSelect={openLawFirmTimelineModal}
      />

      {/* Law Firm Timeline Modal */}
      <LawFirmTimelineModal
        isOpen={modalState.isLawFirmTimelineModalOpen}
        onClose={closeLawFirmTimelineModal}
        selectedProject={timelineState.selectedProjectForTimeline}
        timelineData={timelineState.timelineData}
        timelineLoading={timelineState.timelineLoading}
        onRefresh={timelineState.fetchTimelineData}
      />

      {/* Enhanced Mail Modal */}
      <EnhancedMailModal
        isOpen={modalState.isEnhancedMailModalOpen}
        onClose={closeEnhancedMailModal}
        mails={mailState.mails}
        mailLoading={mailState.mailLoading}
        selectedMail={mailState.selectedMail}
        setSelectedMail={mailState.setSelectedMail}
        onNewMail={modalState.openSendMailModal}
        onLoadMore={mailState.loadMoreMails}
      />

      {/* Timer Modal */}
      <TimerModal
        isOpen={modalState.isTimerModalOpen}
        onClose={modalState.closeTimerModal}
      />

      {/* Notes Modal */}
      <NotesModal
        isOpen={modalState.isNotesModalOpen}
        onClose={modalState.closeNotesModal}
      />

      {/* Case Modal */}
      <CaseModal
        isOpen={modalState.isCaseModalOpen}
        onClose={modalState.closeCasesModal}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        open={modalState.isAddTaskModalOpen}
        onClose={modalState.closeAddTaskModal}
      />

      {/* Meeting Modal */}
      <MeetingModal
        isOpen={modalState.isMeetingModalOpen}
        onClose={modalState.closeMeetingModal}
      />

      {/* Biller Modal */}
      <BillerModal
        isOpen={modalState.isBillerModalOpen}
        onClose={modalState.closeBillerModal}
      />

      {/* Flowchart Modal */}
      <FlowchartModal
        isOpen={modalState.isFlowchartModalOpen}
        onClose={modalState.closeFlowchartModal}
        projects={projectState.projects || []}
        projectsLoading={projectState.projectsLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedProjectForTimeline={timelineState.selectedProjectForTimeline}
        setSelectedProjectForTimeline={timelineState.setSelectedProjectForTimeline}
      />

      {/* Enhanced Chat Modal removed - now a page at /dashboard/private-chat */}

      </>
    );
  }

export default QuickActions;
