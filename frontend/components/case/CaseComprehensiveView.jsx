import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, MessageSquare, CheckCircle, AlertCircle, Play, Pause, Users, Mail, Video, Upload, Download, Eye, Edit, Trash2, Plus, ArrowRight, ChevronDown, ChevronRight, Phone, FileSignature, DollarSign, MessageCircle, Star, ThumbsUp, ThumbsDown, Send, Reply, Archive, Tag, Filter, Search, MoreVertical, ExternalLink, Receipt, BarChart3, Settings, Building2, MapPin, Scale, Gavel } from 'lucide-react';
import { getCaseDetailsRequest, getProjectBillingEntriesRequest, getProjectActivitiesRequest } from '@/lib/http/client';
import { getAllTaskProgressRequest } from '@/lib/http/task';
import { toast } from 'react-toastify';
import moment from 'moment';
import CaseFlowchart from './CaseFlowchart';

// --- helpers: small dedupe utilities ---
const dedupeBy = (arr = [], key) => {
  const seen = new Set();
  return (arr || []).filter((x) => {
    const id = x?.[key];
    if (!id) return true; // keep items without a key
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const flat = (arr) => [].concat(...arr);

// --- core aggregator: builds a Map<task_id, bundle> from all sources ---
const buildTaskBundles = ({ project, caseDetails, billingEntries, projectActivities, timelineData }) => {
  const tasks = (caseDetails?.Tasks || project?.Tasks || []);
  const bundles = new Map();

  // pre-flatten timeline sources (some entries don't have task_id; match by task.name fallback)
  const tlProgress = flat(
    (timelineData?.progress || []).map(p => flat((p.Tasks || []).map(t => t.Progress || [])))
  );
  const tlTimes = flat((timelineData?.times || []).map(t => t.Time || []));

  tasks.forEach((task) => {
    const id = task.task_id;
    const name = task.name;

    // projectActivities
    const actProgress = (projectActivities?.progressEntries || []).filter(p => p.task_id === id);
    const actTimes = (projectActivities?.timeEntries || []).filter(t => t.task_id === id);
    const actReviews = (projectActivities?.reviews || []).filter(r =>
      r.task_id === id || r.task?.name === name
    );

    // timeline (match by task name when task_id missing)
    const tProg = tlProgress.filter(p => (p.task?.name || '').toLowerCase() === (name || '').toLowerCase());
    const tTime = tlTimes.filter(te => (te.task?.name || '').toLowerCase() === (name || '').toLowerCase());

    // combine + dedupe
    const progress = dedupeBy([...(task.Progress || []), ...actProgress, ...tProg], 'progress_id');
    const time = dedupeBy([...(task.Time || []), ...actTimes, ...tTime], 'time_id');
    const reviews = dedupeBy([...(task.inReview || []), ...actReviews], 'review_id');
    const emails = dedupeBy([...(task.Emails || [])], 'email_id');
    const media = dedupeBy([...(task.Media || [])], 'media_id');
    const meetings = dedupeBy([...(task.Meetings || [])], 'meeting_id');
    const bill = (billingEntries || []).filter(be => be.task_id === id);

    bundles.set(id, {
      task,
      progress,
      time,
      reviews,
      emails,
      media,
      meetings,
      billing: bill
    });
  });

  return bundles;
};

const CaseComprehensiveView = ({ project, onClose }) => {
  const [expandedPhases, setExpandedPhases] = useState(new Set());
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState('flowchart');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [caseDetails, setCaseDetails] = useState(null);
  const [billingEntries, setBillingEntries] = useState([]);
  const [projectActivities, setProjectActivities] = useState([]);
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // memoize bundles whenever data changes
  const taskBundles = React.useMemo(() => {
    return buildTaskBundles({ project, caseDetails, billingEntries, projectActivities, timelineData });
  }, [project, caseDetails, billingEntries, projectActivities, timelineData]);

  // open modal by task_id (used by both list + graph)
  const openTaskModalById = React.useCallback((taskId) => {
    const bundle = taskBundles.get(taskId);
    if (bundle) {
      setSelectedTask(bundle.task);
      setSelectedBundle(bundle);
    } else {
      // fallback: still try to find a task by id from caseDetails/project
      const fallback = (caseDetails?.Tasks || project?.Tasks || []).find(t => t.task_id === taskId);
      setSelectedTask(fallback || null);
      setSelectedBundle(null);
    }
  }, [taskBundles, caseDetails, project]);

  // Fetch timeline data for a specific project
  const fetchTimelineData = async (projectId) => {
    if (!projectId) return;

    setTimelineLoading(true);
    try {
      console.log('🔍 Fetching timeline data for project:', projectId);

      // Get current date and format it properly for the API (DD-MM-YYYY)
      const now = new Date();
      const endDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Calculate start date (30 days ago for better coverage)
      const startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

      console.log('🔍 Fetching timeline with dates:', { startDate, endDate });

      // Fetch timeline data using the task progress API
      const res = await getAllTaskProgressRequest(startDate, endDate, null, projectId);
      console.log('🔍 Timeline API response:', res.data);

      if (res.data && res.data.success) {
        const timelineData = {
          progress: res.data.progress || [],
          times: res.data.times || [],
          documents: res.data.documents || []
        };
        console.log('✅ Timeline data fetched successfully:', timelineData);
        setTimelineData(timelineData);
      } else {
        console.warn('⚠️ Timeline API returned no data or error');
        setTimelineData({
          progress: [],
          times: [],
          documents: []
        });
      }
    } catch (error) {
      console.error('❌ Error fetching timeline data:', error);
      setTimelineData({
        progress: [],
        times: [],
        documents: []
      });
    } finally {
      setTimelineLoading(false);
    }
  };

  // Fetch comprehensive case data
  const fetchCaseData = async () => {
    if (!project?.project_id) return;

    setLoading(true);
    try {
      const [caseDetailsResponse, billingEntriesResponse, activitiesResponse] = await Promise.all([
        getCaseDetailsRequest(project.project_id),
        getProjectBillingEntriesRequest(project.project_id),
        getProjectActivitiesRequest(project.project_id)
      ]);

      setCaseDetails(caseDetailsResponse.data.caseDetails);
      setBillingEntries(billingEntriesResponse.data.billingEntries || []);
      setProjectActivities(activitiesResponse.data.activities || []);

      // Also fetch timeline data
      await fetchTimelineData(project.project_id);
    } catch (error) {
      console.error('Error fetching case data:', error);
      toast.error('Failed to fetch case details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseData();
  }, [project?.project_id]);

  // Group tasks by phases
  const tasksByPhase = project?.Tasks?.reduce((acc, task) => {
    const phase = task.phase || 'Unassigned';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(task);
    return acc;
  }, {}) || {};





  // Compute next step for a task
  const getNextStep = (task) => {
    const now = new Date();
    const dueDate = new Date(task.last_date);
    const isOverdue = dueDate < now;

    // Check for blocking items
    if (task.status === 'BLOCKED' && task.stuckReason) {
      return { type: 'blocked', message: `Blocked: ${task.stuckReason}`, priority: 'high' };
    }

    if (isOverdue && task.overDueReason) {
      return { type: 'overdue', message: `Overdue: ${task.overDueReason}`, priority: 'high' };
    }

    // Check for pending reviews
    const pendingReview = task.inReview?.find(review => !review.action);
    if (pendingReview) {
      return { type: 'review', message: `Waiting for review from ${pendingReview.submitted_by?.name || 'Reviewer'}`, priority: 'medium' };
    }

    // Check for upcoming meetings
    const upcomingMeeting = task.Meetings?.find(meeting =>
      meeting.date && new Date(meeting.date) > now && meeting.status === 'SCHEDULED'
    );
    if (upcomingMeeting) {
      const meetingDate = new Date(upcomingMeeting.date);
      const timeUntil = Math.ceil((meetingDate - now) / (1000 * 60 * 60 * 24));
      if (timeUntil <= 1) {
        return { type: 'meeting', message: `Meeting ${timeUntil === 0 ? 'today' : 'tomorrow'} at ${meetingDate.toLocaleTimeString()}`, priority: 'high' };
      }
    }

    // Check for due soon
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 3 && daysUntilDue > 0) {
      return { type: 'due_soon', message: `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`, priority: 'medium' };
    }

    // Default next step based on status
    switch (task.status) {
      case 'TO_DO':
        return { type: 'start', message: 'Ready to start', priority: 'low' };
      case 'IN_PROGRESS':
        return { type: 'continue', message: 'Continue working', priority: 'low' };
      case 'DONE':
        return { type: 'completed', message: 'Task completed', priority: 'low' };
      default:
        return { type: 'pending', message: 'No action required', priority: 'low' };
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'BLOCKED': return 'bg-red-100 text-red-800';
      case 'TO_DO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get next step color
  const getNextStepColor = (type) => {
    switch (type) {
      case 'blocked':
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'review':
      case 'meeting': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'due_soon': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project?.name}</h2>
            <p className="text-sm text-gray-600">Case ID: {project?.project_id} | Status: {project?.status}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>



        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col">


          {activeMainTab === 'flowchart' && (
            <CaseFlowchart
              project={project}
              caseDetails={caseDetails}
              billingEntries={billingEntries}
              projectActivities={projectActivities}
              timelineData={timelineData}
              isActive={activeMainTab === 'flowchart'}
              onTaskClick={openTaskModalById}
            />
          )}


        </div>

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            bundle={selectedBundle}
            onClose={() => { setSelectedTask(null); setSelectedBundle(null); }}
            getNextStep={getNextStep}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            getNextStepColor={getNextStepColor}
          />
        )}
      </div>
    </div>
  );
};




const TaskDetailModal = ({ task, bundle, onClose, getNextStep, getStatusColor, getPriorityColor, getNextStepColor }) => {
  const src = {
    progress: bundle?.progress ?? task.Progress ?? [],
    time: bundle?.time ?? task.Time ?? [],
    reviews: bundle?.reviews ?? task.inReview ?? [],
    emails: bundle?.emails ?? task.Emails ?? [],
    media: bundle?.media ?? task.Media ?? [],
    meetings: bundle?.meetings ?? task.Meetings ?? [],
    billing: bundle?.billing ?? [],
  };

  const events = React.useMemo(() => {
    const out = [];

    // Created
    out.push({
      id: `task-created-${task.task_id}`,
      type: 'task_created',
      title: 'Task Created',
      description: `Task "${task.name}" was created`,
      actor: task.creator,
      created_at: task.created_at,
      icon: Plus,
      color: 'text-blue-600',
      priority: 'medium',
    });

    // Status
    if (task.status !== 'TO_DO') {
      out.push({
        id: `status-${task.task_id}`,
        type: 'status_change',
        title: 'Status Changed',
        description: `Status changed to ${task.status}`,
        actor: task.creator,
        created_at: task.updated_at,
        icon: Edit,
        color: 'text-yellow-600',
        priority: 'medium',
      });
    }

    // Reviews
    src.reviews.forEach((r) => {
      out.push({
        id: `review-${r.review_id}`,
        type: 'review',
        title: 'Review Submitted',
        description: r.submissionDesc,
        actor: r.submitted_by,
        created_at: r.created_at,
        icon: CheckCircle,
        color: 'text-purple-600',
        priority: 'high',
      });
      if (r.action) {
        out.push({
          id: `review-action-${r.review_id}`,
          type: 'review_action',
          title: `Review ${r.action}`,
          description: r.action === 'REJECTED' ? r.rejectedReason : 'Review completed',
          actor: r.acted_by,
          created_at: r.created_at,
          icon: r.action === 'APPROVED' ? ThumbsUp : ThumbsDown,
          color: r.action === 'APPROVED' ? 'text-green-600' : 'text-red-600',
          priority: 'high',
        });
      }
    });

    // Meetings
    src.meetings.forEach((m) => {
      out.push({
        id: `meeting-${m.meeting_id}`,
        type: 'meeting',
        title: 'Meeting Scheduled',
        description: m.heading,
        actor: m.user,
        created_at: m.created_at,
        icon: Video,
        color: 'text-indigo-600',
        priority: 'high',
        metadata: { date: m.date, time: m.time, status: m.status, participants: m.participants },
      });
    });

    // Progress
    src.progress.forEach((p) => {
      out.push({
        id: `progress-${p.progress_id || `${task.task_id}-${p.created_at}`}`,
        type: 'progress',
        title: 'Progress Update',
        description: p.message,
        actor: p.user,
        created_at: p.created_at,
        icon: MessageSquare,
        color: 'text-blue-600',
        priority: 'medium',
        metadata: { type: p.type },
      });
    });

    // Time
    src.time.forEach((t) => {
      out.push({
        id: `time-${t.time_id || `${task.task_id}-${t.start}`}`,
        type: 'time_entry',
        title: 'Time Logged',
        description: t.work_description || 'Time logged',
        actor: t.user,
        created_at: t.created_at || t.start,
        icon: Clock,
        color: 'text-green-600',
        priority: 'low',
        metadata: { start: t.start, end: t.end, status: t.status },
      });
    });

    // Emails
    src.emails.forEach((e) => {
      out.push({
        id: `email-${e.email_id}`,
        type: 'email',
        title: 'Email Sent',
        description: e.subject,
        actor: e.user,
        created_at: e.created_at,
        icon: Mail,
        color: 'text-rose-600',
        priority: 'medium',
        metadata: { is_read: e.is_read },
      });
    });

    // Media
    src.media.forEach((m) => {
      out.push({
        id: `media-${m.media_id}`,
        type: 'media',
        title: 'Document Uploaded',
        description: m.filename,
        actor: m.user,
        created_at: m.created_at,
        icon: Upload,
        color: 'text-orange-600',
        priority: 'medium',
        metadata: { 
          filename: m.filename, 
          size: m.size, 
          mimeType: m.mimeType,
          file_url: m.file_url,
          hasAttachment: !!m.file_url
        },
      });
    });

    // Billing
    src.billing.forEach((b) => {
      out.push({
        id: `billing-${b.line_item_id}`,
        type: 'billing_entry',
        title: 'Billing Entry Added',
        description: `${b.item_type}: ${b.description}`,
        actor: { name: b.user?.name || 'System' },
        created_at: b.created_at,
        icon: DollarSign,
        color: 'text-emerald-600',
        priority: 'medium',
        metadata: {
          quantity: b.quantity,
          unit_rate: b.unit_rate,
          total_amount: b.total_amount,
          status: b.billing?.status,
        },
      });
    });

    // ASC (oldest → newest)
    out.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return out;
  }, [task, src.reviews, src.meetings, src.progress, src.time, src.emails, src.media, src.billing]);

  const nextStep = getNextStep(task);
  const totalBilled = React.useMemo(
    () => (src.billing || []).reduce((s, b) => s + (Number(b.total_amount) || 0), 0),
    [src.billing]
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{task.name}</h3>
              <p className="text-sm text-gray-600">Task ID: {task.task_id}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>{task.status}</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  <Calendar className="w-3 h-3 mr-1" /> Due: {new Date(task.last_date).toLocaleDateString()}
                </span>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${getNextStepColor(nextStep.type)}`}>
                  <ArrowRight className="w-3 h-3 mr-1" /> {nextStep.message}
                </span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <DollarSign className="w-3 h-3 mr-1" /> ${totalBilled.toFixed(2)} billed
                </span>
              </div>
              {task.description && <p className="mt-3 text-sm text-gray-700">{task.description}</p>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
          </div>
        </div>

        {/* Horizontal flow */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="min-w-max">
            <div className="flex items-stretch">
              {events.map((ev, i) => (
                <React.Fragment key={ev.id}>
                  <FlowNode event={ev} />
                  {i < events.length - 1 && (
                    <div className="flex items-center px-2">
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {events.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No events found for this task.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Small box for each event in the horizontal flow
const FlowNode = ({ event }) => {
  const Icon = event.icon || Circle;

  const priorityBadge = (() => {
    switch (event.priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  })();

  // Compact metadata chips
  const chips = [];
  if (event.type) chips.push({ label: event.type.replaceAll('_', ' '), cls: 'bg-slate-100 text-slate-700' });
  if (event.metadata?.status) {
    const s = String(event.metadata.status).toUpperCase();
    chips.push({
      label: s,
      cls:
        ['APPROVED', 'COMPLETED', 'PAID'].includes(s) ? 'bg-green-100 text-green-800' :
          ['REJECTED', 'CANCELED', 'UNPAID'].includes(s) ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
    });
  }
  if (typeof event.metadata?.total_amount !== 'undefined') chips.push({ label: `$${Number(event.metadata.total_amount || 0).toFixed(2)}`, cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' });
  if (typeof event.metadata?.is_read !== 'undefined') chips.push({ label: event.metadata.is_read ? 'Read' : 'Unread', cls: event.metadata.is_read ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' });
  if (event.metadata?.type) chips.push({ label: event.metadata.type, cls: 'bg-blue-100 text-blue-800' });
  if (event.metadata?.participants) chips.push({ label: `${event.metadata.participants.length} participants`, cls: 'bg-purple-100 text-purple-800' });

  return (
    <div className="min-w-[220px] max-w-[260px]">
      <div className="h-full bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${event.color} bg-opacity-10`}>
              <Icon className={`w-4 h-4 ${event.color}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h5 className="text-[13px] font-semibold text-gray-900 truncate">{event.title}</h5>
                {event.priority && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${priorityBadge}`}>{event.priority}</span>
                )}
              </div>
              <div className="text-[11px] text-gray-500">{isNaN(new Date(event.created_at)) ? 'Unknown' : new Date(event.created_at).toLocaleString()}</div>
            </div>
          </div>

          {event.description && (
            <p className="text-[12px] text-gray-700 line-clamp-3">
              {event.description}
            </p>
          )}

          {event.actor?.name && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-500">
              <User className="w-3 h-3" />
              <span className="truncate">by {event.actor.name}</span>
            </div>
          )}

          {chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {chips.map((c, idx) => (
                <span key={idx} className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${c.cls}`}>
                  {c.label}
                </span>
              ))}
            </div>
          )}

          {event.metadata?.filename && (
            <div className="mt-2 text-[11px] text-gray-600 truncate">📄 {event.metadata.filename}</div>
          )}
        </div>
      </div>
    </div>
  );
};




export default CaseComprehensiveView;
