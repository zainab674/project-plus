
'use client';

import React, { Fragment, useState } from 'react';
import { Calendar, Clock, MapPin, User, Award, Briefcase, GraduationCap, FileText, Download, Users, CheckCircle, AlertCircle, PlayCircle, PauseCircle, BarChart3, PieChart, TrendingUp, Mail, Phone, Video, Paperclip, Eye, Edit3, MessageSquare, Target, ChevronDown, ChevronUp, Filter, Search, Calendar as CalendarIcon, Timer, DollarSign, Scale, Gavel, Building, BookOpen, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar, Pie } from 'recharts';

// Comprehensive legal case dummy data
const caseData = {
    caseId: "CV-2024-001847",
    caseName: "Meridian Corp vs. TechFlow Solutions",
    caseType: "Commercial Litigation",
    court: "Superior Court of California",
    judge: "Hon. Margaret Chen",
    startDate: "2024-01-15",
    estimatedEndDate: "2024-08-30",
    totalBudget: 485000,
    spentBudget: 287500,
    status: "Discovery Phase"
};

const teamMembers = [
    { id: 1, name: "Sarah Mitchell", role: "Lead Attorney", hourlyRate: 650, totalHours: 124, avatar: "SM", color: "bg-purple-500" },
    { id: 2, name: "David Rodriguez", role: "Senior Associate", hourlyRate: 450, totalHours: 186, avatar: "DR", color: "bg-blue-500" },
    { id: 3, name: "Emily Chen", role: "Junior Associate", hourlyRate: 280, totalHours: 142, avatar: "EC", color: "bg-green-500" },
    { id: 4, name: "Michael Thompson", role: "Paralegal", hourlyRate: 180, totalHours: 98, avatar: "MT", color: "bg-orange-500" },
    { id: 5, name: "Jessica Park", role: "Legal Assistant", hourlyRate: 120, totalHours: 67, avatar: "JP", color: "bg-pink-500" },
    { id: 6, name: "Robert Kim", role: "Expert Witness", hourlyRate: 800, totalHours: 24, avatar: "RK", color: "bg-indigo-500" }
];

const timelineData = [
    {
        id: 1,
        type: 'case-filing',
        icon: Gavel,
        title: 'Case Filing & Initial Pleadings',
        description: 'Filed complaint against TechFlow Solutions for breach of contract and misappropriation of trade secrets',
        date: '2024-01-15',
        time: '09:00',
        location: 'Superior Court Filing Office',
        status: 'completed',
        priority: 'high',
        assignedTo: [1, 2],
        createdBy: 1,
        startDate: '2024-01-15',
        completedDate: '2024-01-18',
        estimatedHours: 16,
        actualHours: 18.5,
        billableHours: 16,
        phase: 'Pleadings',
        tasks: [
            { id: 1, title: 'Draft complaint', status: 'completed', assignee: 1, hours: 8.5, dueDate: '2024-01-16' },
            { id: 2, title: 'Legal research on trade secret law', status: 'completed', assignee: 2, hours: 6, dueDate: '2024-01-17' },
            { id: 3, title: 'File with court clerk', status: 'completed', assignee: 4, hours: 2, dueDate: '2024-01-18' },
            { id: 4, title: 'Serve defendant', status: 'completed', assignee: 5, hours: 2, dueDate: '2024-01-18' }
        ],
        attachments: [
            { id: 1, name: 'Complaint_Final.pdf', type: 'PDF', size: '2.4 MB', uploadedBy: 1, uploadDate: '2024-01-18' },
            { id: 2, name: 'Trade_Secret_Research.docx', type: 'Word', size: '1.2 MB', uploadedBy: 2, uploadDate: '2024-01-17' },
            { id: 3, name: 'Filing_Receipt.pdf', type: 'PDF', size: '156 KB', uploadedBy: 4, uploadDate: '2024-01-18' }
        ],
        meetings: [
            { id: 1, title: 'Case Strategy Session', date: '2024-01-14', duration: 120, attendees: [1, 2, 3], type: 'internal' },
            { id: 2, title: 'Client Consultation', date: '2024-01-16', duration: 90, attendees: [1, 2], type: 'client' }
        ],
        notes: 'Client provided extensive documentation regarding trade secret protocols. Need to follow up on damages calculation.',
        nextSteps: 'Await defendant response (due 2024-02-17). Prepare for potential motion to dismiss.',
        riskLevel: 'medium',
        budget: { allocated: 25000, spent: 22750 }
    },
    {
        id: 2,
        type: 'discovery',
        icon: Search,
        title: 'Discovery Phase - Document Production',
        description: 'Comprehensive document discovery including ESI review and production of privileged documents',
        date: '2024-02-20',
        time: '10:00',
        location: 'Law Firm Conference Room',
        status: 'in-progress',
        priority: 'high',
        assignedTo: [2, 3, 4],
        createdBy: 1,
        startDate: '2024-02-20',
        estimatedHours: 120,
        actualHours: 78.5,
        billableHours: 72,
        phase: 'Discovery',
        tasks: [
            { id: 5, title: 'ESI protocol negotiation', status: 'completed', assignee: 2, hours: 12, dueDate: '2024-02-25' },
            { id: 6, title: 'Document review batch 1', status: 'completed', assignee: 3, hours: 28, dueDate: '2024-03-01' },
            { id: 7, title: 'Privilege log preparation', status: 'in-progress', assignee: 4, hours: 15, dueDate: '2024-03-15' },
            { id: 8, title: 'Expert witness deposition prep', status: 'pending', assignee: 1, hours: 0, dueDate: '2024-03-20' },
            { id: 9, title: 'Document production to opposing counsel', status: 'pending', assignee: 2, hours: 0, dueDate: '2024-03-25' }
        ],
        attachments: [
            { id: 4, name: 'ESI_Protocol_Agreement.pdf', type: 'PDF', size: '890 KB', uploadedBy: 2, uploadDate: '2024-02-25' },
            { id: 5, name: 'Document_Review_Log.xlsx', type: 'Excel', size: '3.2 MB', uploadedBy: 3, uploadDate: '2024-03-01' },
            { id: 6, name: 'Privilege_Log_Draft.docx', type: 'Word', size: '1.8 MB', uploadedBy: 4, uploadDate: '2024-03-10' },
            { id: 7, name: 'Expert_Witness_CV.pdf', type: 'PDF', size: '445 KB', uploadedBy: 6, uploadDate: '2024-03-05' }
        ],
        meetings: [
            { id: 3, title: 'Discovery Conference', date: '2024-02-18', duration: 180, attendees: [1, 2], type: 'court' },
            { id: 4, title: 'Document Review Training', date: '2024-02-22', duration: 60, attendees: [2, 3, 4], type: 'internal' },
            { id: 5, title: 'Expert Witness Interview', date: '2024-03-05', duration: 90, attendees: [1, 6], type: 'expert' }
        ],
        notes: 'Opposition is being cooperative with document production. Need to prioritize privilege review.',
        nextSteps: 'Complete privilege log by 3/15. Schedule expert witness deposition.',
        riskLevel: 'low',
        budget: { allocated: 85000, spent: 62300 }
    },
    {
        id: 3,
        type: 'motion',
        icon: FileText,
        title: 'Motion for Summary Judgment',
        description: 'Preparing comprehensive motion for summary judgment on breach of contract claims',
        date: '2024-03-18',
        time: '14:00',
        location: 'Law Library',
        status: 'pending',
        priority: 'critical',
        assignedTo: [1, 2, 3],
        createdBy: 1,
        startDate: '2024-03-18',
        estimatedHours: 85,
        actualHours: 0,
        billableHours: 0,
        phase: 'Motion Practice',
        tasks: [
            { id: 10, title: 'Legal research on contract interpretation', status: 'pending', assignee: 2, hours: 0, dueDate: '2024-03-25' },
            { id: 11, title: 'Draft motion brief', status: 'pending', assignee: 1, hours: 0, dueDate: '2024-04-01' },
            { id: 12, title: 'Prepare supporting declarations', status: 'pending', assignee: 3, hours: 0, dueDate: '2024-04-05' },
            { id: 13, title: 'File motion with court', status: 'pending', assignee: 4, hours: 0, dueDate: '2024-04-10' },
            { id: 14, title: 'Prepare for hearing', status: 'pending', assignee: 1, hours: 0, dueDate: '2024-04-25' }
        ],
        attachments: [
            { id: 8, name: 'Motion_Research_Outline.docx', type: 'Word', size: '756 KB', uploadedBy: 2, uploadDate: '2024-03-16' }
        ],
        meetings: [
            { id: 6, title: 'Motion Strategy Meeting', date: '2024-03-15', duration: 120, attendees: [1, 2, 3], type: 'internal' }
        ],
        notes: 'Strong case for summary judgment on contract breach. Focus on performance standards.',
        nextSteps: 'Begin legal research immediately. Schedule client meeting to discuss strategy.',
        riskLevel: 'medium',
        budget: { allocated: 55000, spent: 0 }
    },
    {
        id: 4,
        type: 'deposition',
        icon: Video,
        title: 'Key Witness Depositions',
        description: 'Conducting depositions of key witnesses including former employees and expert witnesses',
        date: '2024-04-15',
        time: '09:00',
        location: 'Meridian Corp Offices',
        status: 'scheduled',
        priority: 'high',
        assignedTo: [1, 2, 4],
        createdBy: 1,
        startDate: '2024-04-15',
        estimatedHours: 45,
        actualHours: 0,
        billableHours: 0,
        phase: 'Discovery',
        tasks: [
            { id: 15, title: 'Prepare deposition outlines', status: 'pending', assignee: 1, hours: 0, dueDate: '2024-04-10' },
            { id: 16, title: 'Coordinate with court reporter', status: 'pending', assignee: 5, hours: 0, dueDate: '2024-04-12' },
            { id: 17, title: 'Review witness statements', status: 'pending', assignee: 2, hours: 0, dueDate: '2024-04-13' },
            { id: 18, title: 'Conduct depositions', status: 'pending', assignee: 1, hours: 0, dueDate: '2024-04-16' }
        ],
        attachments: [
            { id: 9, name: 'Witness_List.xlsx', type: 'Excel', size: '234 KB', uploadedBy: 4, uploadDate: '2024-03-20' },
            { id: 10, name: 'Deposition_Notice.pdf', type: 'PDF', size: '178 KB', uploadedBy: 5, uploadDate: '2024-03-22' }
        ],
        meetings: [
            { id: 7, title: 'Deposition Prep Session', date: '2024-04-08', duration: 180, attendees: [1, 2, 4], type: 'internal' }
        ],
        notes: 'Focus on timeline of events and access to proprietary information.',
        nextSteps: 'Finalize witness list and prepare examination outlines.',
        riskLevel: 'medium',
        budget: { allocated: 28000, spent: 0 }
    },
    {
        id: 5,
        type: 'settlement',
        icon: Scale,
        title: 'Mediation Conference',
        description: 'Court-ordered mediation session to explore settlement opportunities',
        date: '2024-05-20',
        time: '10:00',
        location: 'Mediation Center',
        status: 'scheduled',
        priority: 'high',
        assignedTo: [1, 2],
        createdBy: 1,
        startDate: '2024-05-20',
        estimatedHours: 24,
        actualHours: 0,
        billableHours: 0,
        phase: 'Settlement',
        tasks: [
            { id: 19, title: 'Prepare mediation brief', status: 'pending', assignee: 1, hours: 0, dueDate: '2024-05-15' },
            { id: 20, title: 'Calculate damages analysis', status: 'pending', assignee: 2, hours: 0, dueDate: '2024-05-10' },
            { id: 21, title: 'Client consultation on settlement', status: 'pending', assignee: 1, hours: 0, dueDate: '2024-05-18' },
            { id: 22, title: 'Attend mediation session', status: 'pending', assignee: 1, hours: 0, dueDate: '2024-05-20' }
        ],
        attachments: [],
        meetings: [
            { id: 8, title: 'Settlement Strategy Meeting', date: '2024-05-05', duration: 90, attendees: [1, 2], type: 'internal' }
        ],
        notes: 'Client open to reasonable settlement. Maximum authority $2.5M.',
        nextSteps: 'Prepare comprehensive damages analysis for mediation.',
        riskLevel: 'low',
        budget: { allocated: 15000, spent: 0 }
    }
];

const chartData = [
    { month: 'Jan', hours: 65, budget: 42000 },
    { month: 'Feb', hours: 89, budget: 58000 },
    { month: 'Mar', hours: 124, budget: 78000 },
    { month: 'Apr', hours: 95, budget: 62000 },
    { month: 'May', hours: 78, budget: 48000 }
];

const taskStatusData = [
    { name: 'Completed', value: 9, color: '#10B981' },
    { name: 'In Progress', value: 4, color: '#F59E0B' },
    { name: 'Pending', value: 10, color: '#6B7280' },
    { name: 'Overdue', value: 2, color: '#EF4444' }
];

const phaseData = [
    { phase: 'Pleadings', completed: 100, total: 100 },
    { phase: 'Discovery', completed: 75, total: 100 },
    { phase: 'Motion Practice', completed: 10, total: 100 },
    { phase: 'Settlement', completed: 0, total: 100 }
];


const TimelineItem = ({ item, isLast, expandedItems, toggleExpanded }) => {
    const IconComponent = item.icon;
    const isExpanded = expandedItems.includes(item.id);

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'in-progress': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'pending': return 'bg-slate-50 text-slate-700 border-slate-200';
            case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'case-filing': return 'bg-purple-100 text-purple-700';
            case 'discovery': return 'bg-blue-100 text-blue-700';
            case 'motion': return 'bg-indigo-100 text-indigo-700';
            case 'deposition': return 'bg-green-100 text-green-700';
            case 'settlement': return 'bg-teal-100 text-teal-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getTaskStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
            case 'in-progress': return <PlayCircle className="w-4 h-4 text-amber-600" />;
            case 'pending': return <PauseCircle className="w-4 h-4 text-slate-600" />;
            default: return <AlertCircle className="w-4 h-4 text-slate-600" />;
        }
    };

    const completedTasks = item.tasks.filter(task => task.status === 'completed').length;
    const totalTasks = item.tasks.length;
    const completionPercentage = (completedTasks / totalTasks) * 100;

    return (
        <div className="relative flex items-start space-x-6 pb-8">
            {!isLast && (
                <div className="absolute left-6 top-16 w-0.5 h-full bg-gradient-to-b from-slate-200 to-slate-100" />
            )}

            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getTypeColor(item.type)} shadow-sm border-2 border-white`}>
                <IconComponent className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-slate-800">{item.title}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                                        {item.status.replace('-', ' ')}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                                        {item.priority}
                                    </span>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed mb-4">{item.description}</p>

                                <div className="flex items-center gap-6 text-sm text-slate-500">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {new Date(item.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {item.time}
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        {item.location}
                                    </div>
                                    <div className="flex items-center">
                                        <Target className="w-4 h-4 mr-2" />
                                        {item.phase}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleExpanded(item.id)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                {isExpanded ? 'Less' : 'More'}
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-slate-600 mb-1">
                                <span>Task Progress</span>
                                <span>{completedTasks}/{totalTasks} tasks completed</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-lg font-semibold text-slate-800">{item.actualHours || 0}h</div>
                                <div className="text-xs text-slate-500">Hours Worked</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold text-slate-800">${(item.budget?.spent || 0).toLocaleString()}</div>
                                <div className="text-xs text-slate-500">Budget Spent</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold text-slate-800">{item.assignedTo.length}</div>
                                <div className="text-xs text-slate-500">Team Members</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold text-slate-800">{item.attachments.length}</div>
                                <div className="text-xs text-slate-500">Attachments</div>
                            </div>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                        <div className="p-6 space-y-6">
                            {/* Task Details */}
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2 text-slate-600" />
                                    Task Breakdown
                                </h4>
                                <div className="space-y-3">
                                    {item.tasks.map((task) => {
                                        const assignee = teamMembers.find(m => m.id === task.assignee);
                                        return (
                                            <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {getTaskStatusIcon(task.status)}
                                                    <div>
                                                        <div className="font-medium text-slate-800">{task.title}</div>
                                                        <div className="text-sm text-slate-500">
                                                            Assigned to {assignee?.name} • Due: {new Date(task.dueDate).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium text-slate-800">{task.hours}h</div>
                                                    <div className="text-sm text-slate-500">logged</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Team Assignment */}
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-slate-600" />
                                    Team Assignment
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {item.assignedTo.map((memberId) => {
                                        const member = teamMembers.find(m => m.id === memberId);
                                        return (
                                            <div key={memberId} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                                                <div className={`w-8 h-8 rounded-full ${member?.color} flex items-center justify-center text-white text-sm font-medium`}>
                                                    {member?.avatar}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800">{member?.name}</div>
                                                    <div className="text-sm text-slate-500">{member?.role}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Attachments */}
                            {item.attachments.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                                        <Paperclip className="w-5 h-5 mr-2 text-slate-600" />
                                        Attachments ({item.attachments.length})
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {item.attachments.map((attachment) => {
                                            const uploader = teamMembers.find(m => m.id === attachment.uploadedBy);
                                            return (
                                                <div key={attachment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-slate-600" />
                                                        <div>
                                                            <div className="font-medium text-slate-800">{attachment.name}</div>
                                                            <div className="text-sm text-slate-500">
                                                                {attachment.size} • {uploader?.name} • {new Date(attachment.uploadDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="p-1 text-slate-500 hover:text-slate-700">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-1 text-slate-500 hover:text-slate-700">
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Meetings */}
                            {item.meetings.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                                        <Video className="w-5 h-5 mr-2 text-slate-600" />
                                        Related Meetings
                                    </h4>
                                    <div className="space-y-3">
                                        {item.meetings.map((meeting) => (
                                            <div key={meeting.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div>
                                                    <div className="font-medium text-slate-800">{meeting.title}</div>
                                                    <div className="text-sm text-slate-500">
                                                        {new Date(meeting.date).toLocaleDateString()} • {meeting.duration} min • {meeting.type}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    {meeting.attendees.length} attendees
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Budget Details */}
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                                    <DollarSign className="w-5 h-5 mr-2 text-slate-600" />
                                    Budget Analysis
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-lg font-semibold text-slate-800">${(item.budget?.allocated || 0).toLocaleString()}</div>
                                        <div className="text-sm text-slate-500">Allocated</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-lg font-semibold text-slate-800">${(item.budget?.spent || 0).toLocaleString()}</div>
                                        <div className="text-sm text-slate-500">Spent</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-lg font-semibold text-slate-800">${((item.budget?.allocated || 0) - (item.budget?.spent || 0)).toLocaleString()}</div>
                                        <div className="text-sm text-slate-500">Remaining</div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes & Next Steps */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                                        <MessageSquare className="w-5 h-5 mr-2 text-slate-600" />
                                        Notes
                                    </h4>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-slate-700">{item.notes}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                                        <Target className="w-5 h-5 mr-2 text-slate-600" />
                                        Next Steps
                                    </h4>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-slate-700">{item.nextSteps}</p>
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

const Analytics = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Hours & Budget Trend */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-slate-600" />
                    Hours & Budget Trend
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="budget" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Task Status Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-slate-600" />
                    Task Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                        <Pie
                            data={taskStatusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {taskStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </RechartsPieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    {taskStatusData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm text-slate-600">{item.name}: {item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CaseOverview = () => {
    return (
        <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-6 mb-8 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{caseData.caseName}</h1>
                    <p className="text-slate-600">Case ID: {caseData.caseId} • {caseData.caseType}</p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-semibold text-slate-800">{caseData.status}</div>
                    <div className="text-sm text-slate-500">Current Phase</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{teamMembers.reduce((total, member) => total + member.totalHours, 0)}</div>
                    <div className="text-sm text-slate-600">Total Hours</div>
                    <div className="text-xs text-slate-500">across all team members</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{timelineData.length}</div>
                    <div className="text-sm text-slate-600">Major Milestones</div>
                    <div className="text-xs text-slate-500">completed & pending</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{teamMembers.length}</div>
                    <div className="text-sm text-slate-600">Team Members</div>
                    <div className="text-xs text-slate-500">active on case</div>
                </div>
            </div>


        </div>
    );
};

const TeamPanel = () => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-slate-600" />
                Team Performance
            </h3>
            <div className="space-y-4">
                {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center text-white font-medium`}>
                                {member.avatar}
                            </div>
                            <div>
                                <div className="font-medium text-slate-800">{member.name}</div>
                                <div className="text-sm text-slate-500">{member.role}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-medium text-slate-800">{member.totalHours}h</div>
                            <div className="text-sm text-slate-500">${member.hourlyRate}/hr</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TimelinePage = () => {
    const [expandedItems, setExpandedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [phaseFilter, setPhaseFilter] = useState('all');
    const [showDetails, setShowDetails] = useState(true); // ✅ NEW state


    const toggleExpanded = (itemId) => {
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const filteredData = timelineData.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchesPhase = phaseFilter === 'all' || item.phase === phaseFilter;

        return matchesSearch && matchesStatus && matchesPhase;
    });

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto p-6">
                <CaseOverview />

                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setShowDetails(prev => !prev)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        {showDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                </div>
                {showDetails && (

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <Analytics />

                            {/* Filters */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
                                <div className="flex flex-wrap gap-4 items-center">
                                    <div className="flex items-center gap-2 flex-1 min-w-64">
                                        <Search className="w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search timeline items..."
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="completed">Completed</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="pending">Pending</option>
                                        <option value="scheduled">Scheduled</option>
                                    </select>
                                    <select
                                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={phaseFilter}
                                        onChange={(e) => setPhaseFilter(e.target.value)}
                                    >
                                        <option value="all">All Phases</option>
                                        <option value="Pleadings">Pleadings</option>
                                        <option value="Discovery">Discovery</option>
                                        <option value="Motion Practice">Motion Practice</option>
                                        <option value="Settlement">Settlement</option>
                                    </select>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-0">
                                {filteredData.map((item, index) => (
                                    <TimelineItem
                                        key={item.id}
                                        item={item}
                                        isLast={index === filteredData.length - 1}
                                        expandedItems={expandedItems}
                                        toggleExpanded={toggleExpanded}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <TeamPanel />
                        </div>
                    </div>

                )}
            </div>
        </div>
    );
};

const TimelineModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
                onClick={onClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Scale className="w-6 h-6 text-slate-600" />
                                <h2 className="text-xl font-semibold text-slate-800">Legal Case Management</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[85vh] overflow-y-auto">

                        <TimelinePage />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineModal;