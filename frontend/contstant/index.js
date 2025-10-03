

import React from 'react';
import {
  Search,
  Bell,
  Settings,
  Plus,
  Calendar,
  Mail,
  MessageCircle,
  Users,
  Clock,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Filter,
  MoreHorizontal,
  Briefcase,
  DollarSign,
  Target,
  CheckCircle,
  AlertCircle,
  Circle
} from 'lucide-react';



const menuItems = [
  { name: 'Dashboard', icon: BarChart3, active: true, route: '/cases' },
  { name: 'Cases', icon: Briefcase, route: '/cases', },
  { name: 'Clients', icon: Users, route: '/cases' },
  { name: 'Tasks', icon: CheckCircle, route: '/cases' },
  { name: 'Time Tracking', icon: Clock, route: '/cases' },
  { name: 'Calendar', icon: Calendar, route: '/cases' },
  { name: 'Mail', icon: Mail, route: '/cases' },
  { name: 'Team Chat', icon: MessageCircle, route: '/cases' },
];

const user = {
  name: 'Charles Davis',
  role: 'Senior Partner',
  initials: 'CD'
};

const stats = [
  { title: 'Active Cases', value: '42', change: '+8% from last month', color: 'blue', icon: Briefcase },
  { title: 'Total Clients', value: '128', change: '+12% from last month', color: 'green', icon: Users },
  { title: 'Hours Logged', value: '847', change: '+5% from last month', color: 'yellow', icon: Clock },
  { title: 'Revenue', value: '$89,420', change: '+15% from last month', color: 'green', icon: DollarSign },
];

const caseStatusData = [
  { name: 'Active', value: 45, color: 'bg-blue-500' },
  { name: 'Pending', value: 25, color: 'bg-green-500' },
  { name: 'Closed', value: 20, color: 'bg-red-500' },
  { name: 'On Hold', value: 10, color: 'bg-yellow-500' },
];

const weeklyTimeData = [
  { label: 'Mon', value: 8 },
  { label: 'Tue', value: 6 },
  { label: 'Wed', value: 9 },
  { label: 'Thu', value: 7 },
  { label: 'Fri', value: 9 },
  { label: 'Sat', value: 3 },
  { label: 'Sun', value: 1 },
];

const acquisitionData = [
  { label: 'Leads', value: 156, color: 'bg-blue-500' },
  { label: 'Consultations', value: 89, color: 'bg-blue-400' },
  { label: 'Proposals', value: 45, color: 'bg-green-500' },
  { label: 'Signed Clients', value: 23, color: 'bg-green-400' },
];

const priorityTasks = [
  { text: 'Review contract for Johnson vs. Smith', due: 'Due: Today', priority: 'high' },
  { text: 'Prepare deposition questions', due: 'Due: Tomorrow', priority: 'medium' },
  { text: 'File motion to dismiss', due: 'Due: Friday', priority: 'low' },
  { text: 'Client meeting preparation', due: 'Due: Next Week', priority: 'medium' },
];

const recentActivities = [
  { type: 'document', text: 'Document uploaded to Miller case', time: '2 hours ago' },
  { type: 'time', text: 'Time logged: 3.5 hours on Wilson case', time: '4 hours ago' },
  { type: 'meeting', text: 'Meeting scheduled with Anderson', time: '6 hours ago' },
  { type: 'completed', text: 'Task completed: Discovery review', time: 'Yesterday' },
];

const topCases = [
  { name: 'Johnson vs. Smith', subtitle: 'Corporate Law', primary: '45.2h', secondary: '$18,080', initials: 'JS' },
  { name: 'Miller vs. Wilson', subtitle: 'Family Law', primary: '38.7h', secondary: '$15,480', initials: 'MW' },
  { name: 'Anderson vs. Brown', subtitle: 'Criminal Law', primary: '32.1h', secondary: '$12,840', initials: 'AB' },
  { name: 'Davis vs. Thompson', subtitle: 'Real Estate', primary: '28.9h', secondary: '$11,560', initials: 'DT' },
];

const statusColors = {
  TO_DO: 'bg-gray-200 text-gray-800',
  IN_PROGRESS: 'bg-blue-500 text-white',
  STUCK: 'bg-yellow-500 text-white',
  DONE: 'bg-green-500 text-white',
  OVERDUE: 'bg-red-500 text-white'
};

const priorityColors = {
  LOW: 'text-green-600',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-orange-600',
  CRITICAL: 'text-red-600'
};


const allTasks = [
  {
    id: 1,
    title: 'Task 1',
    caseId: 1,
    status: 'DONE',
    created: '2025-07-13',
    due: '2025-07-30',
    priority: 'HIGH',
    assignee: 'ZS'
  },
  {
    id: 2,
    title: 'Review Documents',
    caseId: 1,
    status: 'IN_PROGRESS',
    created: '2025-07-14',
    due: '2025-07-16',
    priority: 'MEDIUM',
    assignee: 'AA'
  },
  {
    id: 3,
    title: 'Client Meeting',
    caseId: 2,
    status: 'TO_DO',
    created: '2025-07-14',
    due: '2025-07-15',
    priority: 'HIGH',
    assignee: 'SK'
  },
  {
    id: 4,
    title: 'Court Filing',
    caseId: 2,
    status: 'STUCK',
    created: '2025-07-12',
    due: '2025-07-14',
    priority: 'HIGH',
    assignee: 'ZS'
  },
  {
    id: 5,
    title: 'Settlement Negotiation',
    caseId: 3,
    status: 'OVERDUE',
    created: '2025-07-01',
    due: '2025-07-13',
    priority: 'CRITICAL',
    assignee: 'AA'
  }
];

const allCases = [
  {
    id: 1,
    title: 'zainab check',
    caseNumber: 5,
    client: 'zainab',
    opposingParty: 'zainabpart2',
    filingDate: '13-07-2025',
    status: 'Open',
    description: 'checking web',
    tasks: [
      {
        name: "zainab",
        note: "check all details"
      },
      {
        name: "zainab",
        note: "verification"
      }
    ],
  },
  {
    id: 2,
    title: 'Contract Dispute',
    caseNumber: 6,
    client: 'Ahmed Ali',
    opposingParty: 'Tech Corp',
    filingDate: '10-07-2025',
    status: 'InProgress',
    description: 'Software licensing dispute',
    tasks: [
      {
        name: "ali",
        note: "software something"
      },
      {
        name: "ahmed",
        note: "check validity"
      }
    ],
  },
  {
    id: 3,
    title: 'Property Settlement',
    caseNumber: 7,
    client: 'Sarah Khan',
    opposingParty: 'Property Holdings Ltd',
    filingDate: '05-07-2025',
    status: 'UnderReview',
    description: 'Commercial property settlement'
  }



];

export {
  topCases,
  recentActivities,
  priorityTasks,
  acquisitionData,
  weeklyTimeData,
  caseStatusData,
  stats,
  user,
  menuItems,
  statusColors,
  priorityColors,
  allTasks,
  allCases,
}
