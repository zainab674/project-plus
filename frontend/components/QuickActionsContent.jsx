import React from 'react';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
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
  Brain,
  Activity,
  Workflow,
  ListTodo,
} from 'lucide-react';

// Quick Actions Content Component
export const QuickActionsContent = ({ 
  user, 
  allActions, 
  quickActions,
  isSidebarMode,
  modalFunctions
}) => {
  const router = useTabNavigation();
  const { selectedCase } = useDashboardFilter();
  const handleActionClick = (action) => {
    if (action.action) {
      action.action();
    } else if (action.name === 'Cases') {
      // If a case is selected in top navbar, navigate to that case detail page
      // Otherwise, show all cases
      if (selectedCase?.project_id) {
        router.push(`/dashboard/project/${selectedCase.project_id}`);
      } else {
        router.push('/dashboard/cases');
      }
    } else if (action.name === 'Tasks') {
      router.push('/dashboard/tasks');
    } else if (action.name === 'Add Task') {
      router.push('/dashboard/tasks/add');
    } else if (action.name === 'TimeLine') {
      router.push('/dashboard/timeline');
    } else if (action.name === 'Meeting') {
      router.push('/dashboard/meeting');
    } else if (action.name === 'Mail') {
      modalFunctions.openEnhancedMailModal();
    } else if (action.name === 'Chat') {
      modalFunctions.openEnhancedChatModal();
    } else if (action.name === 'Updates') {
      router.push('/dashboard/updates');
    } else if (action.name === 'Team') {
      router.push('/dashboard/team');
    } else if (action.name === 'TemplateDocs') {
      router.push('/dashboard/create-document/1');
    } else if (action.name === 'CompareDocs') {
      router.push('/ai-legal-doc');
    } else if (action.name === 'Flowchart') {
      router.push('/dashboard/flowchart');
    } else if (action.name === 'Phone') {
      router.push('/dashboard/phone');
    } else if (action.name === 'AssignToBiller') {
      router.push('/dashboard/case-assignment');
    } else if (action.name === 'AI Assistant') {
      router.push('/dashboard/ai-assistant');
    } else if (action.name === 'Dashboard') {
      router.push('/dashboard');
    } else if (action.name === 'Time Tracking') {
      router.push('/dashboard/time-tracking-analytics');
    } else if (action.name === 'Case Workflow') {
      router.push('/dashboard/case-workflow');
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
            const isAIAssistant = action.isAIAssistant;
            return (
              <div key={index} className="relative">
                {isAIAssistant ? (
                  <button
                    onClick={() => handleActionClick(action)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group w-full text-left"
                  >
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                        <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center border-2 border-white">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {action.name}
                    </span>
                  </button>
                ) : (
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
                )}
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1" />
        <div className="flex items-center gap-0 justify-center">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            const isAIAssistant = action.isAIAssistant;
            return (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:scale-105 transition-all duration-200 group relative"
                title={action.name}
              >
                {isAIAssistant ? (
                  <div className="relative w-12 h-12">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center group-hover:shadow-md transition-shadow duration-200 shadow-lg">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center border-2 border-white">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                ) : (
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:shadow-md transition-shadow duration-200`}>
                    <IconComponent className="w-6 h-6 text-gray-700" />
                  </div>
                )}
                <span className="text-xs font-medium text-gray-800 text-center">{action.name}</span>
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
      </div>
    </div>
  );
};
