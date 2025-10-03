import React, { useState } from 'react';
import CaseComprehensiveView from './CaseComprehensiveView';

// Sample test data
const sampleProject = {
  project_id: 1,
  name: "Sample Legal Case",
  description: "A comprehensive legal case with multiple phases and tasks",
  status: "Active",
  client_name: "John Doe",
  client_address: "123 Main St, City, State",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-20T15:30:00Z",
  priority: "HIGH",
  phases: ["Discovery", "Negotiation", "Trial Preparation"],
  Members: [
    {
      project_member_id: 1,
      role: "PROVIDER",
      user: { user_id: 1, name: "Sarah Johnson", email: "sarah@lawfirm.com" }
    },
    {
      project_member_id: 2,
      role: "ASSOCIATE",
      user: { user_id: 2, name: "Mike Chen", email: "mike@lawfirm.com" }
    }
  ],
  Clients: [
    {
      project_client_id: 1,
      user: { user_id: 3, name: "John Doe", email: "john@example.com" }
    }
  ],
  Media: [
    {
      media_id: "1",
      filename: "contract.pdf",
      size: 1024000,
      mimeType: "application/pdf",
      created_at: "2024-01-16T09:00:00Z",
      user: { user_id: 1, name: "Sarah Johnson", email: "sarah@lawfirm.com" }
    }
  ],
  Tasks: [
    {
      task_id: 1,
      name: "Review Contract",
      description: "Review the initial contract for legal issues",
      status: "IN_PROGRESS",
      priority: "HIGH",
      phase: "Discovery",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-18T14:20:00Z",
      last_date: "2024-01-25T17:00:00Z",
      stuckReason: null,
      overDueReason: null,
      creator: { user_id: 1, name: "Sarah Johnson", email: "sarah@lawfirm.com" },
      assignees: [
        { user: { user_id: 2, name: "Mike Chen", email: "mike@lawfirm.com" } }
      ],
      inReview: [
        {
          review_id: 1,
          submissionDesc: "Contract review completed, ready for approval",
          action: null,
          submitted_by: { user_id: 2, name: "Mike Chen", email: "mike@lawfirm.com" },
          acted_by: null,
          created_at: "2024-01-18T14:20:00Z"
        }
      ],
      Meetings: [
        {
          meeting_id: "1",
          heading: "Client Meeting",
          description: "Discuss contract terms with client",
          date: "2024-01-22T14:00:00Z",
          time: "2024-01-22T14:00:00Z",
          status: "SCHEDULED",
          user: { user_id: 1, name: "Sarah Johnson", email: "sarah@lawfirm.com" },
          participants: [
            { user: { user_id: 3, name: "John Doe", email: "john@example.com" } }
          ]
        }
      ],
      Progress: [
        {
          progress_id: "1",
          message: "Started reviewing contract sections 1-3",
          type: "COMMENT",
          created_at: "2024-01-16T09:15:00Z",
          user: { user_id: 2, name: "Mike Chen", email: "mike@lawfirm.com" }
        },
        {
          progress_id: "2",
          message: "Completed initial review, found 3 issues",
          type: "COMMENT",
          created_at: "2024-01-17T16:30:00Z",
          user: { user_id: 2, name: "Mike Chen", email: "mike@lawfirm.com" }
        }
      ],
      Time: [
        {
          time_id: "1",
          start: "2024-01-16T09:00:00Z",
          end: "2024-01-16T12:00:00Z",
          status: "ENDED",
          work_description: "Contract review - sections 1-3",
          created_at: "2024-01-16T09:00:00Z",
          user: { user_id: 2, name: "Mike Chen", email: "mike@lawfirm.com" }
        }
      ],
      Comments: [
        {
          comment_id: "1",
          content: "Need to clarify section 4.2 with client",
          created_at: "2024-01-17T10:45:00Z",
          user: { user_id: 2, name: "Mike Chen", email: "mike@lawfirm.com" }
        }
      ],
      Media: [
        {
          media_id: "1",
          filename: "contract_review_notes.pdf",
          size: 512000,
          mimeType: "application/pdf",
          created_at: "2024-01-17T16:30:00Z",
          user: { user_id: 2, name: "Mike Chen", email: "mike@lawfirm.com" }
        }
      ],
      Emails: [
        {
          email_id: "1",
          subject: "Contract Review Update",
          content: "Please find attached the contract review notes",
          created_at: "2024-01-17T17:00:00Z",
          user: { user_id: 2, name: "Mike Chen", email: "mike@lawfirm.com" }
        }
      ]
    },
    {
      task_id: 2,
      name: "Prepare Discovery Documents",
      description: "Gather and prepare all discovery documents",
      status: "TO_DO",
      priority: "MEDIUM",
      phase: "Discovery",
      created_at: "2024-01-15T11:00:00Z",
      updated_at: "2024-01-15T11:00:00Z",
      last_date: "2024-01-30T17:00:00Z",
      stuckReason: null,
      overDueReason: null,
      creator: { user_id: 1, name: "Sarah Johnson", email: "sarah@lawfirm.com" },
      assignees: [
        { user: { user_id: 1, name: "Sarah Johnson", email: "sarah@lawfirm.com" } }
      ],
      inReview: [],
      Meetings: [],
      Progress: [],
      Time: [],
      Comments: [],
      Media: [],
      Emails: []
    },
    {
      task_id: 3,
      name: "Unassigned Task",
      description: "This task is not assigned to any phase",
      status: "BLOCKED",
      priority: "LOW",
      phase: null,
      created_at: "2024-01-15T12:00:00Z",
      updated_at: "2024-01-19T10:00:00Z",
      last_date: "2024-01-20T17:00:00Z",
      stuckReason: "Waiting for client response",
      overDueReason: "Client has not responded to our request",
      creator: { user_id: 1, name: "Sarah Johnson", email: "sarah@lawfirm.com" },
      assignees: [],
      inReview: [],
      Meetings: [],
      Progress: [],
      Time: [],
      Comments: [],
      Media: [],
      Emails: []
    }
  ]
};

const CaseComprehensiveViewTest = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Case Comprehensive View Test</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Data</h2>
        <p className="text-gray-600 mb-4">
          This test component demonstrates the Case Comprehensive View with sample data including:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Case with 3 phases: Discovery, Negotiation, Trial Preparation</li>
          <li>2 team members and 1 client</li>
          <li>3 tasks: 2 in Discovery phase, 1 unassigned</li>
          <li>Complete activity timeline for Task 1 including reviews, meetings, progress, time entries, comments, media, and emails</li>
          <li>Different task statuses: IN_PROGRESS, TO_DO, BLOCKED</li>
          <li>Next step computation for each task</li>
        </ul>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Open Comprehensive Case View
      </button>

      {showModal && (
        <CaseComprehensiveView
          project={sampleProject}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default CaseComprehensiveViewTest;
