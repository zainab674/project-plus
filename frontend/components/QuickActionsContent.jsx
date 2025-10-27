import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../providers/UserProvider';
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
} from 'lucide-react';

// Quick Actions Content Component
export const QuickActionsContent = ({ 
  user, 
  allActions, 
  quickActions,
  isSidebarMode,
  modalFunctions
}) => {
  const router = useRouter();

  const handleActionClick = (action) => {
    if (action.action) {
      action.action();
    } else if (action.name === 'Cases') {
      modalFunctions.openCasesModal();
    } else if (action.name === 'Add Task') {
      modalFunctions.openAddTaskModal();
    } else if (action.name === 'Timer') {
      modalFunctions.openTimerModal();
    } else if (action.name === 'TimeLine') {
      modalFunctions.openTimelineCasesModal();
    } else if (action.name === 'Meeting') {
      modalFunctions.openMeetingModal();
    } else if (action.name === 'Mail') {
      modalFunctions.openEnhancedMailModal();
    } else if (action.name === 'Chat') {
      modalFunctions.openEnhancedChatModal();
    } else if (action.name === 'Team') {
      router.push('/dashboard/team');
    } else if (action.name === 'TemplateDocs') {
      router.push('/dashboard/template-documents');
    } else if (action.name === 'CompareDocs') {
      router.push('/document-comparison');
    } else if (action.name === 'Flowchart') {
      modalFunctions.openFlowchartModal();
    } else if (action.name === 'Phone') {
      router.push('/dashboard/phone');
    } else if (action.name === 'InviteBiller') {
      modalFunctions.openBillerModal();
    } else if (action.name === 'AssignToBiller') {
      modalFunctions.openCaseAssignmentModal();
    } else if (action.name === 'Dashboard') {
      router.push('/dashboard');
    } else if (action.route) {
      router.push(action.route);
    }
  };

  // Sidebar mode layout
  if (isSidebarMode) {
    return (
      <div className="bg-white h-full p-1">
        <div className="flex flex-col gap-0 h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <div key={index} className="relative">
                <button
                  onClick={() => handleActionClick(action)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group w-full text-left"
                >
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="w-5 h-5 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {action.name}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Horizontal mode layout
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0  justify-center mx-auto">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:scale-105 transition-all duration-200 group"
                title={action.name}
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:shadow-md transition-shadow duration-200`}>
                  <IconComponent className="w-6 h-6 text-gray-700" />
                </div>
                <span className="text-xs font-medium text-gray-800 text-center">{action.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
