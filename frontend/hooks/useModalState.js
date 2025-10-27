import { useState, useCallback } from 'react';

// Custom hook for managing modal states
export const useModalState = () => {
  // Modal states
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isBillerModalOpen, setIsBillerModalOpen] = useState(false);
  const [isCaseAssignmentModalOpen, setIsCaseAssignmentModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isFlowchartModalOpen, setIsFlowchartModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isTimelineCasesModalOpen, setIsTimelineCasesModalOpen] = useState(false);
  const [isLawFirmTimelineModalOpen, setIsLawFirmTimelineModalOpen] = useState(false);
  const [isEnhancedMailModalOpen, setIsEnhancedMailModalOpen] = useState(false);
  const [isConnectMailModalOpen, setIsConnectMailModalOpen] = useState(false);
  const [isSendMailModalOpen, setIsSendMailModalOpen] = useState(false);
  const [isEnhancedChatModalOpen, setIsEnhancedChatModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  // Modal handlers
  const openCasesModal = useCallback(() => setIsCaseModalOpen(true), []);
  const closeCasesModal = useCallback(() => setIsCaseModalOpen(false), []);

  const openChatModal = useCallback(() => setIsChatModalOpen(true), []);
  const closeChatModal = useCallback(() => setIsChatModalOpen(false), []);

  const openMailModal = useCallback(() => setIsMailModalOpen(true), []);
  const closeMailModal = useCallback(() => setIsMailModalOpen(false), []);

  const openTemplateModal = useCallback(() => setIsTemplateModalOpen(true), []);
  const closeTemplateModal = useCallback(() => setIsTemplateModalOpen(false), []);

  const openTimelineModal = useCallback(() => setIsTimelineModalOpen(true), []);
  const closeTimelineModal = useCallback(() => setIsTimelineModalOpen(false), []);

  const openBillerModal = useCallback(() => setIsBillerModalOpen(true), []);
  const closeBillerModal = useCallback(() => setIsBillerModalOpen(false), []);

  const openCaseAssignmentModal = useCallback(() => setIsCaseAssignmentModalOpen(true), []);
  const closeCaseAssignmentModal = useCallback(() => setIsCaseAssignmentModalOpen(false), []);

  const openSignatureModal = useCallback(() => setIsSignatureModalOpen(true), []);
  const closeSignatureModal = useCallback(() => setIsSignatureModalOpen(false), []);

  const openMeetingModal = useCallback(() => setIsMeetingModalOpen(true), []);
  const closeMeetingModal = useCallback(() => setIsMeetingModalOpen(false), []);

  const openAddTaskModal = useCallback(() => setIsAddTaskModalOpen(true), []);
  const closeAddTaskModal = useCallback(() => setIsAddTaskModalOpen(false), []);

  const openFlowchartModal = useCallback(() => setIsFlowchartModalOpen(true), []);
  const closeFlowchartModal = useCallback(() => {
    setIsFlowchartModalOpen(false);
  }, []);

  const openTimelineCasesModal = useCallback(() => setIsTimelineCasesModalOpen(true), []);
  const closeTimelineCasesModal = useCallback(() => {
    setIsTimelineCasesModalOpen(false);
  }, []);

  const openLawFirmTimelineModal = useCallback(() => setIsLawFirmTimelineModalOpen(true), []);
  const closeLawFirmTimelineModal = useCallback(() => {
    setIsLawFirmTimelineModalOpen(false);
  }, []);

  const openEnhancedMailModal = useCallback(() => setIsEnhancedMailModalOpen(true), []);
  const closeEnhancedMailModal = useCallback(() => setIsEnhancedMailModalOpen(false), []);

  const openConnectMailModal = useCallback(() => setIsConnectMailModalOpen(true), []);
  const closeConnectMailModal = useCallback(() => setIsConnectMailModalOpen(false), []);

  const openSendMailModal = useCallback(() => setIsSendMailModalOpen(true), []);
  const closeSendMailModal = useCallback(() => setIsSendMailModalOpen(false), []);

  const openEnhancedChatModal = useCallback(() => setIsEnhancedChatModalOpen(true), []);
  const closeEnhancedChatModal = useCallback(() => setIsEnhancedChatModalOpen(false), []);

  const openTimerModal = useCallback(() => setIsTimerModalOpen(true), []);
  const closeTimerModal = useCallback(() => setIsTimerModalOpen(false), []);

  return {
    // States
    isCaseModalOpen,
    isChatModalOpen,
    isMailModalOpen,
    isMeetingModalOpen,
    isTemplateModalOpen,
    isTimelineModalOpen,
    isBillerModalOpen,
    isCaseAssignmentModalOpen,
    isSignatureModalOpen,
    isFlowchartModalOpen,
    isAddTaskModalOpen,
    isTimelineCasesModalOpen,
    isLawFirmTimelineModalOpen,
    isEnhancedMailModalOpen,
    isConnectMailModalOpen,
    isSendMailModalOpen,
    isEnhancedChatModalOpen,
    isTimerModalOpen,
    
    // Handlers
    openCasesModal,
    closeCasesModal,
    openChatModal,
    closeChatModal,
    openMailModal,
    closeMailModal,
    openTemplateModal,
    closeTemplateModal,
    openTimelineModal,
    closeTimelineModal,
    openBillerModal,
    closeBillerModal,
    openCaseAssignmentModal,
    closeCaseAssignmentModal,
    openSignatureModal,
    closeSignatureModal,
    openMeetingModal,
    closeMeetingModal,
    openAddTaskModal,
    closeAddTaskModal,
    openFlowchartModal,
    closeFlowchartModal,
    openTimelineCasesModal,
    closeTimelineCasesModal,
    openLawFirmTimelineModal,
    closeLawFirmTimelineModal,
    openEnhancedMailModal,
    closeEnhancedMailModal,
    openConnectMailModal,
    closeConnectMailModal,
    openSendMailModal,
    closeSendMailModal,
    openEnhancedChatModal,
    closeEnhancedChatModal,
    openTimerModal,
    closeTimerModal,
  };
};
