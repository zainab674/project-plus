# Case Comprehensive View

## Overview
The Case Comprehensive View provides a complete hierarchical view of cases with full activity timeline tracking. It displays cases in a structured format: **Case → Phases → Tasks** with comprehensive activity tracking for each task.

## Features

### 1. Case Overview
- **Case Information**: Name, ID, status, client, description, creation date, priority
- **Team Members**: All assigned internal members with their roles
- **Clients**: All case clients with contact information
- **Documents**: Case-level files and documents

### 2. Phase Management
- **Phase Organization**: Tasks grouped by phases
- **Unassigned Tasks**: Tasks without phases displayed separately
- **Expandable Phases**: Click to expand/collapse phase details
- **Task Count**: Shows number of tasks per phase

### 3. Task Details
- **Task Information**: Name, description, status, priority, assignees, due dates
- **Next Step Computation**: Intelligent next step calculation based on:
  - Blocking items (stuck reasons, overdue reasons)
  - Pending reviews
  - Upcoming meetings
  - Due dates
  - Current status
- **Quick Stats**: Meetings, documents, updates, time entries

### 4. Complete Activity Timeline
For each task, shows a chronological timeline (newest → oldest) of all events:

#### Event Types:
- **Task Creation**: When task was created
- **Status Changes**: Status updates and changes
- **Reviews**: Review submissions, approvals, rejections
- **Meetings**: Scheduled, updated, cancelled, completed meetings
- **Progress Updates**: Status updates and progress notes
- **Time Entries**: Time logging with start/end times
- **Comments**: Task comments and notes
- **Media Uploads**: Document uploads and file changes
- **Emails**: Email communications
- **Transcriptions**: Meeting transcriptions

#### Timeline Event Details:
- **Event ID**: Unique identifier
- **Type**: Event type (task_created, status_change, review, etc.)
- **Title**: Event title
- **Description**: Detailed description
- **Actor**: User who performed the action
- **Affected Member**: User affected by the action (if applicable)
- **Related IDs**: Links to related documents, meetings, etc.
- **Created At**: Timestamp
- **Visibility**: Internal or client-visible
- **Metadata**: Additional event-specific data

### 5. Next Step Logic
The system intelligently computes the next step for each task based on priority:

1. **High Priority**:
   - Blocked items (stuck reasons)
   - Overdue items with reasons
   - Upcoming meetings (today/tomorrow)

2. **Medium Priority**:
   - Pending reviews
   - Due soon (within 3 days)

3. **Low Priority**:
   - Status-based next steps (start, continue, completed)

### 6. Visual Indicators
- **Status Colors**: Green (completed), Blue (in progress), Red (blocked), Gray (pending)
- **Priority Colors**: Red (critical), Orange (high), Yellow (medium), Green (low)
- **Next Step Colors**: Red (blocked/overdue), Orange (review/meeting), Yellow (due soon), Gray (normal)

## Usage

### Integration with FlowchartModal
The comprehensive view is integrated into the existing FlowchartModal:

```jsx
// In FlowchartModal.jsx
import CaseComprehensiveView from '../case/CaseComprehensiveView';

// Add button to open comprehensive view
<Button
    onClick={() => setShowComprehensiveView(true)}
    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
>
    <Eye className="w-4 h-4" />
    View Comprehensive Case
</Button>

// Add modal
{showComprehensiveView && selectedProjectForTimeline && (
    <CaseComprehensiveView
        project={selectedProjectForTimeline}
        onClose={() => setShowComprehensiveView(false)}
    />
)}
```

### Data Requirements
The component expects a project object with the following structure:

```javascript
{
  project_id: number,
  name: string,
  description: string,
  status: string,
  client_name: string,
  created_at: string,
  updated_at: string,
  priority: string,
  phases: string[],
  Members: Array<{
    project_member_id: number,
    role: string,
    user: { user_id: number, name: string, email: string }
  }>,
  Clients: Array<{
    project_client_id: number,
    user: { user_id: number, name: string, email: string }
  }>,
  Tasks: Array<{
    task_id: number,
    name: string,
    description: string,
    status: string,
    priority: string,
    phase: string,
    created_at: string,
    updated_at: string,
    last_date: string,
    stuckReason: string,
    overDueReason: string,
    creator: { user_id: number, name: string, email: string },
    assignees: Array<{
      user: { user_id: number, name: string, email: string }
    }>,
    inReview: Array<{
      review_id: number,
      submissionDesc: string,
      action: string,
      submitted_by: { user_id: number, name: string, email: string },
      acted_by: { user_id: number, name: string, email: string }
    }>,
    Meetings: Array<{
      meeting_id: string,
      heading: string,
      description: string,
      date: string,
      time: string,
      status: string,
      user: { user_id: number, name: string, email: string },
      participants: Array<{
        user: { user_id: number, name: string, email: string }
      }>
    }>,
    Progress: Array<{
      progress_id: string,
      message: string,
      type: string,
      created_at: string,
      user: { user_id: number, name: string, email: string }
    }>,
    Time: Array<{
      time_id: string,
      start: string,
      end: string,
      status: string,
      work_description: string,
      created_at: string,
      user: { user_id: number, name: string, email: string }
    }>,
    Comments: Array<{
      comment_id: string,
      content: string,
      created_at: string,
      user: { user_id: number, name: string, email: string }
    }>,
    Media: Array<{
      media_id: string,
      filename: string,
      size: number,
      mimeType: string,
      created_at: string,
      user: { user_id: number, name: string, email: string }
    }>,
    Emails: Array<{
      email_id: string,
      subject: string,
      content: string,
      created_at: string,
      user: { user_id: number, name: string, email: string }
    }>
  }>
}
```

## Components

### CaseComprehensiveView
Main component that renders the complete case view with sidebar and main content area.

### TaskCard
Individual task card component with expandable details and next step information.

### TaskDetailModal
Modal that shows detailed task information including complete activity timeline.

### TimelineEvent
Individual timeline event component with appropriate icons and styling.

## Styling
Uses Tailwind CSS for styling with a clean, professional design:
- Gray color scheme for neutral elements
- Blue for primary actions and case information
- Green for completed/success states
- Red for blocked/error states
- Orange for warnings and unassigned tasks
- Purple for phases

## Future Enhancements
- Real-time updates for timeline events
- Advanced filtering and search within timeline
- Export timeline to PDF
- Bulk task operations
- Custom timeline event types
- Integration with external calendar systems
