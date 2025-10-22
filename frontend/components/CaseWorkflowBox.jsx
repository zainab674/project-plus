"use client"

import React, { useState, useEffect } from 'react';
import { ChevronDown, Workflow, Calendar, Users, FileText, Clock } from 'lucide-react';
import PhaseTasksModal from './modals/PhaseTasksModal';
import { useRouter } from 'next/navigation';

const CaseWorkflowBox = ({ 
  selectedCase = null, 
  allCases = [], 
  onCaseSelect = null,
  className = "" 
}) => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentCase, setCurrentCase] = useState(selectedCase);
  const [workflowData, setWorkflowData] = useState(null);
  
  // Phase modal states
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [selectedPhaseName, setSelectedPhaseName] = useState('');
  const [selectedPhaseTasks, setSelectedPhaseTasks] = useState([]);

  // Update current case when selectedCase prop changes
  useEffect(() => {
    if (selectedCase) {
      setCurrentCase(selectedCase);
    } else if (allCases.length > 0 && !currentCase) {
      // Default to most recent case
      const recentCase = allCases.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      setCurrentCase(recentCase);
    }
  }, [selectedCase, allCases]);

  // Generate workflow data from case
  useEffect(() => {
    if (currentCase) {
      generateWorkflowData(currentCase);
    }
  }, [currentCase]);

  const generateWorkflowData = (caseData) => {
    if (!caseData) return;

    const phases = caseData.phases || [];
    const tasks = caseData.Tasks || [];
    const members = caseData.Members || [];
    
    // Group tasks by phase
    const tasksByPhase = {};
    phases.forEach(phase => {
      tasksByPhase[phase] = tasks.filter(task => task.phase === phase);
    });

    // Calculate phase progress
    const phaseProgress = phases.map(phase => {
      const phaseTasks = tasksByPhase[phase] || [];
      const totalTasks = phaseTasks.length;
      const completedTasks = phaseTasks.filter(task => task.status === 'DONE').length;
      const inProgressTasks = phaseTasks.filter(task => task.status === 'IN_PROGRESS').length;
      
      return {
        name: phase,
        totalTasks,
        completedTasks,
        inProgressTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        status: completedTasks === totalTasks ? 'completed' : 
                inProgressTasks > 0 ? 'in-progress' : 'pending'
      };
    });

    setWorkflowData({
      caseName: caseData.name,
      caseStatus: caseData.status,
      casePriority: caseData.priority,
      phases: phaseProgress,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === 'DONE').length,
      teamMembers: members.length
    });
  };

  const handleCaseSelect = (caseItem) => {
    setCurrentCase(caseItem);
    setShowDropdown(false);
    if (onCaseSelect) {
      onCaseSelect(caseItem);
    }
  };

  const generateMermaidFlowchart = () => {
    if (!workflowData) return '';

    const { phases, caseName, caseStatus } = workflowData;
    
    let mermaidText = `flowchart LR
    classDef start fill:#4caf50,stroke:#2e7d32,stroke-width:3px
    classDef completed fill:#e8f5e9,stroke:#43a047,stroke-width:2px
    classDef inprogress fill:#fff8e1,stroke:#fb8c00,stroke-width:2px
    classDef pending fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px
    classDef end fill:#f44336,stroke:#c62828,stroke-width:3px

    Start([${caseName}<br/>Status: ${caseStatus}]):::start
`;

    phases.forEach((phase, index) => {
      const phaseClass = phase.status === 'completed' ? 'completed' : 
                       phase.status === 'in-progress' ? 'inprogress' : 'pending';
      
      mermaidText += `    P${index}["${phase.name}<br/>${phase.completedTasks}/${phase.totalTasks} tasks<br/>${phase.progress}%"]:::${phaseClass}
`;
      
      if (index === 0) {
        mermaidText += `    Start --> P${index}
`;
      } else {
        mermaidText += `    P${index - 1} --> P${index}
`;
      }
    });

    mermaidText += `    P${phases.length - 1} --> End([Case Complete]):::end
`;

    return mermaidText;
  };

  // Handle phase click to open modal
  const handlePhaseClick = (phaseName) => {
    const tasks = currentCase?.Tasks?.filter(task => task.phase === phaseName) || [];
    setSelectedPhaseName(phaseName);
    setSelectedPhaseTasks(tasks);
    setPhaseModalOpen(true);
  };

  // Handle phase modal close
  const handlePhaseModalClose = () => {
    setPhaseModalOpen(false);
    setSelectedPhaseName('');
    setSelectedPhaseTasks([]);
  };

  // Handle task click from phase modal
  const handleTaskClickFromPhase = (task) => {
    // Navigate to the case detail page where the task is located
    if (currentCase?.project_id) {
      router.push(`/dashboard/project/${currentCase.project_id}`);
    }
    // Close the phase modal
    setPhaseModalOpen(false);
  };

  const renderWorkflowChart = () => {
    if (!workflowData) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <Workflow className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No case selected</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Case Info */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 text-sm">{workflowData.caseName}</h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              workflowData.caseStatus === 'Active' ? 'bg-green-100 text-green-800' :
              workflowData.caseStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {workflowData.caseStatus}
            </span>
          </div>
          
          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-blue-600">{workflowData.totalTasks}</div>
              <div className="text-gray-500">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">{workflowData.completedTasks}</div>
              <div className="text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-600">{workflowData.teamMembers}</div>
              <div className="text-gray-500">Team</div>
            </div>
          </div>
        </div>

        {/* Horizontal Flowchart */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h5 className="text-lg font-semibold text-gray-900 mb-6 text-center">Case Workflow Progress</h5>
          <div className="overflow-x-auto pb-4">
            <div className="flex items-center justify-center space-x-4 min-w-max">
              {/* Start Node */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-white border-2 border-gray-400 rounded-xl flex items-center justify-center shadow-sm">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-800">START</div>
                    <div className="text-xs text-gray-600">Case Begin</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 text-center font-medium">Case Start</div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
                <div className="text-gray-500 text-xl font-bold">→</div>
              </div>

              {/* Phase Nodes */}
              {workflowData.phases.map((phase, index) => (
                <div key={index} className="flex items-center">
                  {/* Phase Node */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-24 h-20 border-2 rounded-xl flex items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-all ${
                        phase.status === 'completed' ? 'bg-gray-200 border-gray-500' :
                        phase.status === 'in-progress' ? 'bg-gray-100 border-gray-400' :
                        'bg-white border-gray-300'
                      }`}
                      onClick={() => handlePhaseClick(phase.name)}
                      title={`Click to view tasks in ${phase.name}`}
                    >
                      <div className="text-center px-1">
                        <div className="text-xs font-bold text-gray-800 leading-tight break-words">
                          {phase.name.length > 12 ? `${phase.name.substring(0, 12)}...` : phase.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {phase.progress}%
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2 text-center font-medium max-w-24">
                      {phase.completedTasks}/{phase.totalTasks} tasks
                    </div>
                  </div>

                  {/* Arrow (except for last phase) */}
                  {index < workflowData.phases.length - 1 && (
                    <div className="flex flex-col items-center ml-4">
                      <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
                      <div className="text-gray-500 text-xl font-bold">→</div>
                    </div>
                  )}
                </div>
              ))}

              {/* Arrow before end */}
              {workflowData.phases.length > 0 && (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
                  <div className="text-gray-500 text-xl font-bold">→</div>
                </div>
              )}

              {/* End Node */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-white border-2 border-gray-400 rounded-xl flex items-center justify-center shadow-sm">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-800">END</div>
                    <div className="text-xs text-gray-600">Complete</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 text-center font-medium">Case End</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-gray-700 mb-2 font-medium">
              <span>Overall Case Progress</span>
              <span className="font-bold">{Math.round((workflowData.completedTasks / workflowData.totalTasks) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3">
              <div 
                className="bg-gray-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.round((workflowData.completedTasks / workflowData.totalTasks) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{workflowData.completedTasks} completed</span>
              <span>{workflowData.totalTasks - workflowData.completedTasks} remaining</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Workflow className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Case Workflow</h3>
        </div>
        
        {/* Case Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-white rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <span className="text-gray-700">
              {currentCase ? currentCase.name : 'Select Case'}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                {allCases.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    No cases available
                  </div>
                ) : (
                  allCases.map((caseItem) => (
                    <button
                      key={caseItem.project_id}
                      onClick={() => handleCaseSelect(caseItem)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                        currentCase?.project_id === caseItem.project_id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{caseItem.name}</div>
                      <div className="text-gray-500">{caseItem.status}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 min-h-[300px]">
        {renderWorkflowChart()}
      </div>

      {/* Phase Tasks Modal */}
      <PhaseTasksModal
        isOpen={phaseModalOpen}
        onClose={handlePhaseModalClose}
        phaseName={selectedPhaseName}
        tasks={selectedPhaseTasks}
        onTaskClick={handleTaskClickFromPhase}
      />

    </div>
  );
};

export default CaseWorkflowBox;
