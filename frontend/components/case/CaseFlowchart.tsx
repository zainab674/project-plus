import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Filter, Download, Copy, Eye, EyeOff, X, Clock, User, MessageSquare, Mail, CheckCircle, AlertCircle, Upload, FileText } from 'lucide-react';
import mermaid from 'mermaid';
import moment from 'moment';

// Utility function to download files with proper filename
const downloadFile = async (url, filename) => {
  try {
    console.log('Downloading file:', { url, filename });
    
    // Always prioritize the provided filename over URL extraction
    let finalFilename = filename;
    
    // Only extract from URL if no filename is provided at all
    if (!finalFilename && url) {
      const urlParts = url.split('/');
      finalFilename = urlParts[urlParts.length - 1];
      // Remove query parameters if any
      finalFilename = finalFilename.split('?')[0];
    }
    
    console.log('Final filename:', finalFilename);
    
    // First try the blob approach
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    });
    
    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      // Fallback to direct link approach
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename || 'document';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    
  } catch (error) {
    console.error('Download error:', error);
    // Fallback to direct link approach
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
      // Last resort - open in new tab
      window.open(url, '_blank');
    }
  }
};

// Types
type CaseModel = {
  id: string;
  name: string;
  status: string;
  priority: string;
  filingDate: string;
  phases: string[];
  tasksByPhase: Record<string, TaskModel[]>;
  members: { name: string; role: string; legalRole?: string }[];
  clients: {
    name: string;
    email: string;
    docs: { name: string; status: string }[];
    signed: { name: string; status: string }[];
    filled: { name: string; status: string }[];
    updates: { message: string }[];
    billing: { amount: number; status: string }[];
  }[];
  billingSummary: { totalAmount: number; unpaid: number };
  emailsByTask: Record<string, number>;
  timeByTask: Record<string, { count: number; totalMinutes: number }>;
  timelineByTask: Record<string, TimelineEvent[]>;
};

type TaskModel = {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: string;
  assignees: string[];
  phase: string;
  isOverdue: boolean;
};

type TimelineEvent = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: string;
};

type Filters = {
  phases?: string[];
  assignees?: string[];
  statuses?: string[];
};

// Helper functions
function isOverdue(task: any): boolean {
  if (!task.last_date || task.status === 'DONE') return false;
  return new Date(task.last_date) < new Date();
}

function taskClass(status: string, overdue: boolean): string {
  if (overdue) return 'task_bad';
  switch (status) {
    case 'DONE': return 'task_done';
    case 'TO_DO': return 'task_todo';
    case 'IN_PROGRESS': return 'task_ip';
    case 'BLOCKED': return 'task_bad';
    default: return 'task_todo';
  }
}

function sumTime(entries: any[]): number {
  return entries.reduce((total, entry) => {
    if (entry.start && entry.end) {
      const start = new Date(entry.start);
      const end = new Date(entry.end);
      return total + (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    }
    return total;
  }, 0);
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function truncateText(text: string, maxLength: number = 40): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Normalize API data
export function normalizeApi(
  overview: any,
  details: any,
  billing: any[],
  activities: any,
  timeline: any
): CaseModel {
  const phases = overview?.phases || ['Document Review', 'Negotiation', 'Closing'];

  // Build tasks by phase
  const tasksByPhase: Record<string, TaskModel[]> = {};
  phases.forEach(phase => {
    tasksByPhase[phase] = [];
  });

  overview?.Tasks?.forEach((task: any) => {
    const phase = task.phase || 'Unassigned';
    if (!tasksByPhase[phase]) tasksByPhase[phase] = [];

    tasksByPhase[phase].push({
      id: `T${task.task_id}`,
      name: task.name,
      status: task.status,
      priority: task.priority,
      dueDate: task.last_date,
      assignees: task.assignees?.map((a: any) => a.user?.name).filter(Boolean) || [],
      phase,
      isOverdue: isOverdue(task)
    });
  });

  // Build members
  const members = overview?.Members?.map((member: any) => ({
    name: member.user?.name || 'Unknown',
    role: member.role || 'Member',
    legalRole: member.legalRole
  })) || [];

  // Build clients
  const clients = overview?.Clients?.map((client: any) => ({
    name: client.user?.name || 'Unknown Client',
    email: client.user?.email || '',
    docs: client.Documents?.map((doc: any) => ({
      name: doc.filename || doc.name || 'Document',
      status: doc.status || 'PENDING'
    })) || [],
    signed: client.signed?.map((signed: any) => ({
      name: signed.filename || signed.name || 'Document',
      status: signed.status || 'PENDING'
    })) || [],
    filled: client.Filled?.map((filled: any) => ({
      name: filled.filename || filled.name || 'Document',
      status: filled.status || 'PENDING'
    })) || [],
    updates: client.Updates?.map((update: any) => ({
      message: update.message || 'Update'
    })) || [],
    billing: client.Billing?.map((bill: any) => ({
      amount: bill.amount || 0,
      status: bill.status || 'UNPAID'
    })) || []
  })) || [];

  // Build billing summary
  const billingSummary = {
    totalAmount: billing.reduce((sum, entry) => sum + (entry.total_amount || 0), 0),
    unpaid: billing.filter(entry => entry.status === 'UNPAID').reduce((sum, entry) => sum + (entry.total_amount || 0), 0)
  };

  // Build emails by task
  const emailsByTask: Record<string, number> = {};
  overview?.Tasks?.forEach((task: any) => {
    emailsByTask[`T${task.task_id}`] = task.Emails?.length || 0;
  });

  // Build time by task
  const timeByTask: Record<string, { count: number; totalMinutes: number }> = {};
  overview?.Tasks?.forEach((task: any) => {
    const timeEntries = task.Time || [];
    timeByTask[`T${task.task_id}`] = {
      count: timeEntries.length,
      totalMinutes: Math.round(sumTime(timeEntries))
    };
  });

  // Build timeline by task
  const timelineByTask: Record<string, TimelineEvent[]> = {};
  overview?.Tasks?.forEach((task: any) => {
    const events: TimelineEvent[] = [];

    // Progress entries
    task.Progress?.forEach((progress: any, index: number) => {
      events.push({
        id: `P${task.task_id}_${index}`,
        type: 'progress',
        message: truncateText(progress.message || 'Progress update'),
        timestamp: progress.created_at,
        user: progress.user?.name || 'Unknown'
      });
    });

    // Reviews
    task.inReview?.forEach((review: any, index: number) => {
      events.push({
        id: `R${task.task_id}_${index}`,
        type: 'review',
        message: truncateText(review.submissionDesc || 'Review submitted'),
        timestamp: review.created_at,
        user: review.submitted_by?.name || 'Unknown'
      });
    });

    // Emails
    task.Emails?.forEach((email: any, index: number) => {
      events.push({
        id: `E${task.task_id}_${index}`,
        type: 'email',
        message: truncateText(email.subject || 'Email sent'),
        timestamp: email.created_at,
        user: email.user?.name || 'Unknown'
      });
    });

    // Time logs
    task.Time?.forEach((time: any, index: number) => {
      events.push({
        id: `T${task.task_id}_${index}`,
        type: 'time',
        message: truncateText(time.work_description || 'Time logged'),
        timestamp: time.created_at,
        user: time.user?.name || 'Unknown'
      });
    });

    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    timelineByTask[`T${task.task_id}`] = events;
  });

  return {
    id: `C${overview?.project_id}`,
    name: overview?.name || 'Unknown Case',
    status: overview?.status || 'Unknown',
    priority: overview?.priority || 'NONE',
    filingDate: overview?.created_at || '',
    phases,
    tasksByPhase,
    members,
    clients,
    billingSummary,
    emailsByTask,
    timeByTask,
    timelineByTask
  };
}

// Build Mermaid diagram
export function buildMermaid(model: CaseModel, filters: Filters = {}): string {
  const { phases = [], assignees = [], statuses = [] } = filters;

  let mermaidText = `flowchart LR
    classDef case fill:#e3f2fd,stroke:#1e88e5,stroke-width:2px;
    classDef phase fill:#eeeeee,stroke:#9e9e9e;
    classDef task_done fill:#e8f5e9,stroke:#43a047;
    classDef task_todo fill:#f5f5f5,stroke:#9e9e9e;
    classDef task_ip fill:#fff8e1,stroke:#fb8c00;
    classDef task_bad fill:#ffebee,stroke:#e53935;
    classDef person fill:#fafafa,stroke:#424242;
    classDef client fill:#f3e5f5,stroke:#8e24aa;
    classDef good fill:#e8f5e9,stroke:#43a047;
    classDef pending fill:#fff3e0,stroke:#ff9800;
    classDef bad fill:#ffebee,stroke:#e53935;
    classDef neutral fill:#e0f7fa,stroke:#00838f;

    %% Case Node
    ${model.id}["${model.name}<br/>Status: ${model.status}<br/>Priority: ${model.priority}<br/>Filed: ${formatDate(model.filingDate)}"]:::case

    %% Phases Subgraph
    subgraph PH["Case Phases"]
      direction LR
`;

  // Add phases
  model.phases.forEach((phase, index) => {
    if (phases.length === 0 || phases.includes(phase)) {
      mermaidText += `      P${index}["${phase}"]:::phase\n`;
      if (index > 0) {
        mermaidText += `      P${index - 1} --> P${index}\n`;
      }
    }
  });

  mermaidText += `    end\n\n`;

  // Add tasks under phases
  model.phases.forEach((phase, phaseIndex) => {
    if (phases.length === 0 || phases.includes(phase)) {
      const tasks = model.tasksByPhase[phase] || [];
      const filteredTasks = tasks.filter(task =>
        (statuses.length === 0 || statuses.includes(task.status)) &&
        (assignees.length === 0 || task.assignees.some(assignee => assignees.includes(assignee)))
      );

      if (filteredTasks.length > 0) {
        mermaidText += `    subgraph T${phaseIndex}["${phase} Tasks"]\n`;
        filteredTasks.forEach(task => {
          const taskClassValue = taskClass(task.status, task.isOverdue);
          mermaidText += `      ${task.id}["Task #${task.id.replace('T', '')}: ${task.name}<br/>${task.status} · Due ${formatDate(task.dueDate)}<br/>Assignees: ${task.assignees.join(', ') || 'None'}<br/>Click to view timeline"]:::${taskClassValue}\n`;
        });
        mermaidText += `    end\n`;
        mermaidText += `    P${phaseIndex} --> T${phaseIndex}\n\n`;
      }
    }
  });

  // People Subgraph
  mermaidText += `    subgraph PEOPLE["People & Clients"]\n`;
  mermaidText += `      direction TB\n`;

  // Members
  if (model.members.length > 0) {
    mermaidText += `      subgraph MEMBERS["Team Members"]\n`;
    model.members.forEach((member, index) => {
      mermaidText += `        M${index}["${member.name}<br/>${member.role}${member.legalRole ? ` · ${member.legalRole}` : ''}"]:::person\n`;
    });
    mermaidText += `      end\n`;
  }

  // Clients
  if (model.clients.length > 0) {
    mermaidText += `      subgraph CLIENTS["Clients"]\n`;
    model.clients.forEach((client, index) => {
      mermaidText += `        CL${index}["${client.name}<br/>${client.email}"]:::client\n`;
    });
    mermaidText += `      end\n`;
  }

  mermaidText += `    end\n\n`;

  // Evidence & Money Subgraph
  mermaidText += `    subgraph EVIDENCE["Evidence & Money"]\n`;
  mermaidText += `      direction TB\n`;

  // Client Documents
  model.clients.forEach((client, clientIndex) => {
    if (client.docs.length > 0) {
      mermaidText += `      subgraph DOCS${clientIndex}["${client.name} Documents"]\n`;
      client.docs.forEach((doc, docIndex) => {
        const docClass = doc.status === 'APPROVED' ? 'good' : 'pending';
        mermaidText += `        D${clientIndex}_${docIndex}["${doc.name}: ${doc.status}"]:::${docClass}\n`;
      });
      mermaidText += `      end\n`;
    }
  });

  // Signed Documents
  model.clients.forEach((client, clientIndex) => {
    if (client.signed.length > 0) {
      mermaidText += `      subgraph SIGNED${clientIndex}["${client.name} Signed"]\n`;
      client.signed.forEach((signed, signedIndex) => {
        const signedClass = signed.status === 'APPROVED' ? 'good' : 'pending';
        mermaidText += `        S${clientIndex}_${signedIndex}["${signed.name} · ${signed.status}"]:::${signedClass}\n`;
      });
      mermaidText += `      end\n`;
    }
  });

  // Filled Documents
  model.clients.forEach((client, clientIndex) => {
    if (client.filled.length > 0) {
      mermaidText += `      subgraph FILLED${clientIndex}["${client.name} Filled"]\n`;
      client.filled.forEach((filled, filledIndex) => {
        const filledClass = filled.status === 'COMPLETED' ? 'good' : 'pending';
        mermaidText += `        F${clientIndex}_${filledIndex}["${filled.name} · ${filled.status}"]:::${filledClass}\n`;
      });
      mermaidText += `      end\n`;
    }
  });

  // Emails and Time
  mermaidText += `      subgraph ACTIVITY["Activity Summary"]\n`;
  Object.entries(model.emailsByTask).forEach(([taskId, count]) => {
    if (count > 0) {
      mermaidText += `        E${taskId}["Emails: ${count}"]:::neutral\n`;
    }
  });
  Object.entries(model.timeByTask).forEach(([taskId, timeData]) => {
    if (timeData.count > 0) {
      mermaidText += `        T${taskId}["Time: ${timeData.count} · ${timeData.totalMinutes}m"]:::neutral\n`;
    }
  });
  mermaidText += `      end\n`;

  // Billing
  if (model.billingSummary.totalAmount > 0) {
    const billingClass = model.billingSummary.unpaid > 0 ? 'bad' : 'good';
    mermaidText += `      BILLING["Billing: $${model.billingSummary.totalAmount} · ${model.billingSummary.unpaid > 0 ? 'UNPAID' : 'PAID'}"]:::${billingClass}\n`;
  }

  mermaidText += `    end\n\n`;

  // Connect case to phases
  mermaidText += `    ${model.id} --> PH\n`;
  mermaidText += `    ${model.id} --> PEOPLE\n`;
  mermaidText += `    ${model.id} --> EVIDENCE\n\n`;

  // Connect clients to case
  model.clients.forEach((_, clientIndex) => {
    mermaidText += `    CL${clientIndex} --> ${model.id}\n`;
  });

  // Connect tasks to assignees
  Object.values(model.tasksByPhase).flat().forEach(task => {
    task.assignees.forEach(assignee => {
      const memberIndex = model.members.findIndex(m => m.name === assignee);
      if (memberIndex !== -1) {
        mermaidText += `    M${memberIndex} --> ${task.id}\n`;
      }
    });
  });

  // Connect tasks to evidence
  Object.values(model.tasksByPhase).flat().forEach(task => {
    if (model.emailsByTask[task.id] > 0) {
      mermaidText += `    ${task.id} --> E${task.id}\n`;
    }
    if (model.timeByTask[task.id]?.count > 0) {
      mermaidText += `    ${task.id} --> T${task.id}\n`;
    }
  });

  // Add task timelines
  Object.values(model.tasksByPhase).flat().forEach(task => {
    const timeline = model.timelineByTask[task.id] || [];
    if (timeline.length > 0) {
      mermaidText += `\n    subgraph TIMELINE${task.id}["${task.name} Timeline"]\n`;
      mermaidText += `      direction LR\n`;
      timeline.forEach((event, index) => {
        const nextEvent = timeline[index + 1];
        mermaidText += `      ${event.id}["${event.message}<br/>${event.user} · ${formatDate(event.timestamp)}"]:::neutral\n`;
        if (nextEvent) {
          mermaidText += `      ${event.id} --> ${nextEvent.id}\n`;
        }
      });
      mermaidText += `    end\n`;
      mermaidText += `    ${task.id} --> TIMELINE${task.id}\n`;
    }
  });

  return mermaidText;
}

// Main Component
const CaseFlowchart: React.FC<{
  project: any;
  caseDetails: any;
  billingEntries: any[];
  projectActivities: any[];
  timelineData: any;
  isActive?: boolean;
  onTaskClick?: (taskId: number) => void;
}> = ({ project, caseDetails, billingEntries, projectActivities, timelineData, isActive = true, onTaskClick }) => {
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskTimeline, setShowTaskTimeline] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRenderingRef = useRef<boolean>(false);
  const renderIdRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);

  // Initialize Mermaid and track mount status
  useEffect(() => {
    setIsMounted(true);
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      }
    });

    return () => {
      setIsMounted(false);
      // Reset render ID to prevent stale renders
      renderIdRef.current = 0;
    };
  }, []);

  // Single consolidated effect for rendering with better debouncing
  useEffect(() => {
    if (isActive && isMounted && project && caseDetails) {
      // Clear any existing timeout
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      
      // Add a longer delay to prevent rapid re-renders and allow data to stabilize
      renderTimeoutRef.current = setTimeout(() => {
        if (isMounted && chartRef.current && !isRenderingRef.current) {
          console.log('Starting delayed render...');
          renderChart();
        }
      }, 1000); // Increased from 100ms to 1000ms
      
      return () => {
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current);
        }
      };
    }
  }, [isActive, isMounted, project?.project_id, caseDetails?.name]);

  // Separate effect for filter changes with longer delay
  useEffect(() => {
    if (isActive && isMounted && project && caseDetails) {
      // Clear any existing timeout
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      
      // Longer delay for filter changes to prevent rapid re-renders
      renderTimeoutRef.current = setTimeout(() => {
        if (isMounted && chartRef.current && !isRenderingRef.current) {
          console.log('Filter change - starting delayed render...');
          renderChart();
        }
      }, 2000); // 2 second delay for filter changes
      
      return () => {
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current);
        }
      };
    }
  }, [filters]);

  const renderChart = async () => {
    console.log('renderChart called, isMounted:', isMounted, 'chartRef.current:', !!chartRef.current, 'isRendering:', isRenderingRef.current);
    
    if (!isMounted) {
      console.warn('Component not mounted, skipping render');
      return;
    }

    if (isRenderingRef.current) {
      console.warn('Render already in progress, skipping');
      return;
    }

    if (!chartRef.current) {
      console.warn('Chart ref not available, skipping render');
      return;
    }

    // Check if we have the minimum required data
    if (!project || !caseDetails) {
      console.warn('Missing required data, skipping render');
      return;
    }

    // Cooldown check - prevent renders too close together
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    if (timeSinceLastRender < 2000) { // 2 second cooldown
      console.warn('Render cooldown active, skipping render');
      return;
    }

    // Generate unique render ID
    const currentRenderId = ++renderIdRef.current;
    lastRenderTimeRef.current = now;
    isRenderingRef.current = true;
    setIsLoading(true);

    // Store the current ref to avoid race conditions
    const currentRef = chartRef.current;

    try {
      const model = normalizeApi(project, caseDetails, billingEntries, projectActivities, timelineData);
      const mermaidText = buildMermaid(model, filters);

      console.log('Generated Mermaid text:', mermaidText.substring(0, 200) + '...');

      // Check if still mounted before clearing content
      if (!isMounted || !currentRef) {
        console.warn('Component unmounted during preparation');
        return;
      }

      // Clear previous content
      currentRef.innerHTML = '<div class="flex items-center justify-center py-8"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div><span class="ml-2 text-gray-600">Rendering...</span></div>';

      // Render with Mermaid
      const { svg } = await mermaid.render('caseChart', mermaidText);

      // Check if this render is still valid (not superseded by a newer render)
      if (currentRenderId !== renderIdRef.current) {
        console.warn('Render superseded by newer render, skipping');
        return;
      }

      // Check if still mounted and ref available before setting content
      if (!isMounted) {
        console.warn('Component unmounted during Mermaid rendering');
        return;
      }

      if (!currentRef || currentRef !== chartRef.current) {
        console.warn('Ref changed during Mermaid rendering');
        return;
      }

      if (isMounted && currentRef && currentRef === chartRef.current) {
        currentRef.innerHTML = svg;

        // Add click event listeners to task nodes
        setTimeout(() => {
          if (isMounted && currentRef && currentRef === chartRef.current) {
            console.log('Setting up click handlers...');
            
            // Add a general click handler to the entire chart container
            const chartContainer = currentRef;
            chartContainer.addEventListener('click', (e) => {
              console.log('Chart container clicked');
              handleNodeClick(e);
            });
            
            // Also add to SVG if it exists
            const svg = currentRef.querySelector('svg');
            if (svg) {
              svg.addEventListener('click', (e) => {
                console.log('SVG clicked');
                handleNodeClick(e);
              });
            }
            
            // Find and style task nodes for visual feedback
            const allNodes = currentRef.querySelectorAll('g, rect, text, [id]');
            const taskNodes = Array.from(allNodes).filter(node => {
              const text = node.textContent || '';
              return text.includes('Task #') && text.includes(':');
            });
            
            console.log('Found task nodes for styling:', taskNodes.length);
            
            taskNodes.forEach((node, index) => {
              console.log(`Styling task node ${index}:`, node.textContent);
              (node as HTMLElement).style.cursor = 'pointer';
              
              // Add visual feedback
              node.addEventListener('mouseenter', () => {
                (node as HTMLElement).style.opacity = '0.8';
              });
              node.addEventListener('mouseleave', () => {
                (node as HTMLElement).style.opacity = '1';
              });
            });
          } else {
            console.warn('Component unmounted or ref changed during click handler setup');
          }
        }, 300);

        console.log('Chart rendered successfully');
      } else {
        console.warn('Component unmounted or ref changed during rendering');
      }
    } catch (error) {
      console.error('Error rendering chart:', error);
      if (isMounted && currentRef && currentRef === chartRef.current) {
        currentRef.innerHTML = '<div class="text-red-500 p-4">Error rendering flowchart: ' + error.message + '</div>';
      }
    } finally {
      isRenderingRef.current = false;
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    renderChart();
  };

  const handleTaskClick = (taskId: string) => {
    console.log('handleTaskClick called with taskId:', taskId);
    console.log('Available tasks:', project?.Tasks?.map(t => `T${t.task_id}: ${t.name}`));

    // Extract numeric task ID from string format like "T10"
    const numericTaskId = parseInt(taskId.replace('T', ''));

    if (onTaskClick && !isNaN(numericTaskId)) {
      console.log('Calling onTaskClick with numeric ID:', numericTaskId);
      onTaskClick(numericTaskId);
    } else {
      // Fallback to internal modal
      const task = project?.Tasks?.find((t: any) => `T${t.task_id}` === taskId);
      console.log('Found task:', task);

      if (task) {
        console.log('Opening task timeline for:', task.name);
        setSelectedTask(task);
        setShowTaskTimeline(true);
      } else {
        console.log('Task not found! Available task IDs:', project?.Tasks?.map(t => `T${t.task_id}`));
      }
    }
  };

  const handleNodeClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    const taskId = target.id;

    console.log('Node clicked:', taskId, target);
    console.log('Target text content:', target.textContent);
    console.log('Target parent:', target.parentElement);

    // Check if it's a task node by ID
    if (taskId && taskId.startsWith('T')) {
      console.log('Found task by ID:', taskId);
      handleTaskClick(taskId);
      return;
    }

    // Check if it's a task node by text content
    const text = target.textContent || '';
    if (text.includes('Task #') && text.includes(':')) {
      const match = text.match(/Task #(\d+):/);
      if (match) {
        const extractedTaskId = `T${match[1]}`;
        console.log('Found task by text content:', extractedTaskId);
        handleTaskClick(extractedTaskId);
        return;
      }
    }

    // Check parent elements for task content
    let parent = target.parentElement;
    while (parent && parent !== currentRef) {
      const parentText = parent.textContent || '';
      if (parentText.includes('Task #') && parentText.includes(':')) {
        const match = parentText.match(/Task #(\d+):/);
        if (match) {
          const extractedTaskId = `T${match[1]}`;
          console.log('Found task in parent element:', extractedTaskId);
          handleTaskClick(extractedTaskId);
          return;
        }
      }
      parent = parent.parentElement;
    }

    console.log('No task found for this click');
  };

  const closeTaskTimeline = () => {
    setShowTaskTimeline(false);
    setSelectedTask(null);
  };

  const handleDownloadSVG = () => {
    if (chartRef.current) {
      const svg = chartRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'case-flowchart.svg';
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleDownloadPNG = () => {
    if (chartRef.current) {
      const svg = chartRef.current.querySelector('svg');
      if (svg) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'case-flowchart.png';
              link.click();
              URL.revokeObjectURL(url);
            }
          });
        };

        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        img.src = svgUrl;
      }
    }
  };

  const handleCopyMermaid = () => {
    if (project && caseDetails) {
      const model = normalizeApi(project, caseDetails, billingEntries, projectActivities, timelineData);
      const mermaidText = buildMermaid(model, filters);
      navigator.clipboard.writeText(mermaidText);
    }
  };

  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType]?.includes(value)
        ? prev[filterType]!.filter(v => v !== value)
        : [...(prev[filterType] || []), value]
    }));
  };

  const getAvailableFilters = () => {
    if (!project) return { phases: [], assignees: [], statuses: [] };

    const phases = project.phases || [];
    const assignees = Array.from(new Set(project.Tasks?.flatMap((task: any) =>
      task.assignees?.map((a: any) => a.user?.name).filter(Boolean) || []
    ) || []));
    const statuses = Array.from(new Set(project.Tasks?.map((task: any) => task.status).filter(Boolean) || []));

    return { phases, assignees, statuses };
  };

  const availableFilters = getAvailableFilters();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Case Flowchart</h3>
          <div className="flex items-center space-x-2">

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleDownloadSVG}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <Download className="w-4 h-4" />
              <span>SVG</span>
            </button>
            <button
              onClick={handleDownloadPNG}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              <Download className="w-4 h-4" />
              <span>PNG</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Visual representation of case structure, tasks, people, and evidence.
          Use filters to focus on specific phases, assignees, or task statuses.
        </p>
      </div>



      {/* Chart Container */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Rendering flowchart...</span>
          </div>
        ) : (
          <div ref={chartRef} className="w-full overflow-auto" />
        )}
      </div>

      {/* Task Timeline Modal */}
      {showTaskTimeline && selectedTask && (
        <TaskTimelineModal
          task={selectedTask}
          onClose={closeTaskTimeline}
        />
      )}
    </div>
  );
};

// Task Timeline Modal Component
const TaskTimelineModal: React.FC<{
  task: any;
  onClose: () => void;
}> = ({ task, onClose }) => {
  const [activeTab, setActiveTab] = useState('timeline');

  // Create comprehensive timeline for the task
  const createTaskTimeline = () => {
    const timeline = [];

    // Task creation
    timeline.push({
      id: `task-created-${task.task_id}`,
      type: 'task_created',
      title: 'Task Created',
      description: `Task "${task.name}" was created`,
      actor: task.creator,
      created_at: task.created_at,
      icon: 'Plus',
      color: 'text-blue-500'
    });

    // Status changes
    if (task.status !== 'TO_DO') {
      timeline.push({
        id: `status-${task.task_id}`,
        type: 'status_change',
        title: 'Status Changed',
        description: `Status changed to ${task.status}`,
        actor: task.creator,
        created_at: task.updated_at,
        icon: 'Edit',
        color: 'text-yellow-500'
      });
    }

    // Reviews
    task.inReview?.forEach((review: any) => {
      timeline.push({
        id: `review-${review.review_id}`,
        type: 'review',
        title: 'Review Submitted',
        description: review.submissionDesc,
        actor: review.submitted_by,
        created_at: review.created_at,
        icon: 'CheckCircle',
        color: 'text-purple-500'
      });

      if (review.action) {
        timeline.push({
          id: `review-action-${review.review_id}`,
          type: 'review_action',
          title: `Review ${review.action}`,
          description: review.action === 'REJECTED' ? review.rejectedReason : 'Review completed',
          actor: review.acted_by,
          created_at: review.created_at,
          icon: review.action === 'APPROVED' ? 'CheckCircle' : 'AlertCircle',
          color: review.action === 'APPROVED' ? 'text-green-500' : 'text-red-500'
        });
      }
    });

    // Meetings
    task.Meetings?.forEach((meeting: any) => {
      timeline.push({
        id: `meeting-${meeting.meeting_id}`,
        type: 'meeting',
        title: 'Meeting Scheduled',
        description: meeting.heading,
        actor: meeting.user,
        created_at: meeting.created_at,
        icon: 'Video',
        color: 'text-indigo-500'
      });
    });

    // Progress updates
    task.Progress?.forEach((progress: any) => {
      timeline.push({
        id: `progress-${progress.progress_id}`,
        type: 'progress',
        title: 'Progress Update',
        description: progress.message,
        actor: progress.user,
        created_at: progress.created_at,
        icon: 'MessageSquare',
        color: 'text-blue-500'
      });
    });

    // Time entries
    task.Time?.forEach((timeEntry: any) => {
      timeline.push({
        id: `time-${timeEntry.time_id}`,
        type: 'time_entry',
        title: 'Time Logged',
        description: timeEntry.work_description || 'Time logged',
        actor: timeEntry.user,
        created_at: timeEntry.created_at,
        icon: 'Clock',
        color: 'text-green-500'
      });
    });

    // Comments
    task.Comments?.forEach((comment: any) => {
      timeline.push({
        id: `comment-${comment.comment_id}`,
        type: 'comment',
        title: 'Comment Added',
        description: comment.content,
        actor: comment.user,
        created_at: comment.created_at,
        icon: 'MessageSquare',
        color: 'text-gray-500'
      });
    });

    // Media uploads
    task.Media?.forEach((media: any) => {
      timeline.push({
        id: `media-${media.media_id}`,
        type: 'media',
        title: 'Document Uploaded',
        description: media.filename,
        actor: media.user,
        created_at: media.created_at,
        icon: 'Upload',
        color: 'text-orange-500',
        hasAttachment: !!media.file_url,
        attachmentUrl: media.file_url,
        attachmentName: media.filename
      });
    });

    // Emails
    task.Emails?.forEach((email: any) => {
      timeline.push({
        id: `email-${email.email_id}`,
        type: 'email',
        title: 'Email Sent',
        description: email.subject,
        actor: email.user,
        created_at: email.created_at,
        icon: 'Mail',
        color: 'text-red-500'
      });
    });

    // Sort by creation date (newest first)
    return timeline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const timeline = createTaskTimeline();

  const getIcon = (iconName: string) => {
    const icons: any = {
      Plus: '➕',
      Edit: '✏️',
      CheckCircle: '✅',
      AlertCircle: '⚠️',
      Video: '📹',
      MessageSquare: '💬',
      Clock: '⏰',
      Upload: '📤',
      Mail: '📧'
    };
    return icons[iconName] || '📝';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'BLOCKED': return 'bg-red-100 text-red-800';
      case 'TO_DO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Task Timeline</h3>
            <p className="text-sm text-gray-600">Task #{task.task_id}: {task.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Task Info */}
        <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Status</span>
              <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                {task.status}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Priority</span>
              <span className="text-sm text-gray-900 ml-2">{task.priority}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Due Date</span>
              <span className="text-sm text-gray-900 ml-2">{formatDate(task.last_date)}</span>
            </div>
          </div>
          {task.description && (
            <div className="mt-3">
              <span className="text-sm font-medium text-gray-600">Description</span>
              <p className="text-sm text-gray-900 mt-1">{task.description}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'timeline'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Complete Timeline
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Task Details
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h4>
              {timeline.length > 0 ? (
                timeline.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${event.color} bg-opacity-20`}>
                      {getIcon(event.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-900">{event.title}</h5>
                        <time className="text-xs text-gray-500">
                          {moment(event.created_at).format('MMM DD, YYYY HH:mm')}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center justify-between">
                        {event.actor && (
                          <div className="flex items-center space-x-2">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">by {event.actor.name}</span>
                          </div>
                        )}
                        {event.hasAttachment && event.attachmentUrl && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadFile(event.attachmentUrl, event.attachmentName)}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                            >
                              Download
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                  <p className="text-gray-500">No timeline activities have been recorded for this task yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Task Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Task ID</span>
                    <p className="text-sm text-gray-900">#{task.task_id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Created</span>
                    <p className="text-sm text-gray-900">{moment(task.created_at).format('LLL')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Updated</span>
                    <p className="text-sm text-gray-900">{moment(task.updated_at).format('LLL')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Phase</span>
                    <p className="text-sm text-gray-900">{task.phase || 'Unassigned'}</p>
                  </div>
                </div>
              </div>

              {task.assignees && task.assignees.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Assignees</h4>
                  <div className="space-y-2">
                    {task.assignees.map((assignee: any) => (
                      <div key={assignee.user.user_id} className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {assignee.user.name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-900">{assignee.user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Activity Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{task.Meetings?.length || 0}</div>
                    <div className="text-sm text-gray-500">Meetings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{task.Progress?.length || 0}</div>
                    <div className="text-sm text-gray-500">Progress Updates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{task.Time?.length || 0}</div>
                    <div className="text-sm text-gray-500">Time Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{task.Media?.length || 0}</div>
                    <div className="text-sm text-gray-500">Documents</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseFlowchart;
