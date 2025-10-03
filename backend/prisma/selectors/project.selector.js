export const projectSelector = {
  Members: {
    select: {
      project_member_id: true,
      role: true,
      legalRole: true,
      customLegalRole: true,
      added_at: true,
      user: {
        select: {
          user_id: true,
          email: true,
          name: true,
        },
      },
    },
  },
  Tasks: {
    select: {
      task_id: true,
      description: true,
      assigned_to: true,
      name: true,
      created_at: true,
      last_date: true,
      updated_at: true,
      status: true,
      priority: true,
      Transcibtions: true,
      phase: true,
      assignees: {
        select: {
          user: {
            select: {
              user_id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      inReview: {
        select: {
          review_id: true,
          submissionDesc: true,
          file_url: true,
          size: true,
          mimeType: true,
          filename: true,
          key: true,
          action: true,
          rejectedReason: true,
          created_at: true,
        },
      },
    },
  },
  Clients: {
    select: {
      project_client_id: true,
      user: {
        select: {
          user_id: true,
          email: true,
          name: true,
        },
      },
    },
  },
};
