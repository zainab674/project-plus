import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { prisma } from "../prisma/index.js";
import { uploadToCloud } from '../services/mediaService.js';

export const getConversationID = catchAsyncError(async (req, res, next) => {
  let { user_id, task_id } = req.body;
  user_id = parseInt(user_id);
  const my_id = req.user.user_id;

  const task = await prisma.task.findUnique({
    where: {
      task_id: parseInt(task_id)
    }
  });

  const projectData = {};
  if (task) {
    projectData.project_id = task.project_id
  }
  let conversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      task_id: parseInt(task_id),
      ...projectData,
      AND: [
        {
          participants: {
            some: {
              user_id: user_id,
            },
          },
        },
        {
          participants: {
            some: {
              user_id: my_id,
            },
          },
        },
        {
          participants: {
            every: {
              user_id: {
                in: [user_id, my_id],
              },
            },
          },
        },
      ],
    },
    select: {
      conversation_id: true,
      participants: true,
    },
  });

  // If no conversation exists, create one
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        task_id: parseInt(task_id),
        participants: {
          create: [
            { user_id: user_id },
            { user_id: my_id },
          ],
        },
      },
      select: {
        conversation_id: true,
      },
    });
  }

  // Return the conversation ID in the response
  res.status(200).json({
    success: true,
    conversation_id: conversation.conversation_id,
  });
});

// New dedicated function for private chat conversation ID
export const getPrivateChatConversationID = catchAsyncError(async (req, res, next) => {
  let { user_id, task_id } = req.body;
  user_id = parseInt(user_id);
  const my_id = req.user.user_id;

  const task = await prisma.task.findUnique({
    where: {
      task_id: parseInt(task_id)
    }
  });

  const projectData = {};
  if (task) {
    projectData.project_id = task.project_id
  }

  let conversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false, // Private chat only
      task_id: parseInt(task_id),
      ...projectData,
      AND: [
        {
          participants: {
            some: {
              user_id: user_id,
            },
          },
        },
        {
          participants: {
            some: {
              user_id: my_id,
            },
          },
        },
        {
          participants: {
            every: {
              user_id: {
                in: [user_id, my_id],
              },
            },
          },
        },
      ],
    },
    select: {
      conversation_id: true,
      participants: true,
    },
  });

  // Let's also check what conversations exist for this task
  const allTaskConversations = await prisma.conversation.findMany({
    where: {
      task_id: parseInt(task_id)
    },
    include: {
      participants: true
    }
  });

  // If no conversation exists, create one
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        isGroup: false, // Private chat
        task_id: parseInt(task_id),
        participants: {
          create: [
            { user_id: user_id },
            { user_id: my_id },
          ],
        },
      },
      select: {
        conversation_id: true,
      },
    });
  } else {

    // Check if there are any existing messages for this conversation
    const existingMessages = await prisma.message.findMany({
      where: {
        conversation_id: conversation.conversation_id
      }
    });
  }

  // Return the conversation ID in the response
  res.status(200).json({
    success: true,
    conversation_id: conversation.conversation_id,
  });
});

export const getConversations = catchAsyncError(async (req, res, next) => {
  const { conversation_id } = req.params;

  let conversations = await prisma.message.findMany({
    where: {
      conversation_id: conversation_id
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Return the conversation ID in the response
  res.status(200).json({
    success: true,
    conversations,
  });
});

// New dedicated function for private chat conversations
export const getPrivateChatConversations = catchAsyncError(async (req, res, next) => {
  const { conversation_id } = req.params;

  // First, let's check what messages exist for this conversation without any filters
  let allMessages = await prisma.message.findMany({
    where: {
      conversation_id: conversation_id
    },
    include: {
      sender: {
        select: {
          user_id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Now filter for private chat messages (is_group_chat is false or null)
  allMessages.forEach((msg, index) => {

  });

  let conversations = allMessages.filter(message =>
    message.is_group_chat === false || message.is_group_chat === null
  );

  // Return the conversation ID in the response
  res.status(200).json({
    success: true,
    conversations,
  });
});

export const getConversationUsers = catchAsyncError(async (req, res, next) => {
  const my_id = req.user.user_id;
  const conversationUserList = await prisma.participant.findMany({
    where: {
      conversation: {
        participants: {
          some: {
            user_id: Number(my_id),
          },
        },
      },
      NOT: {
        user_id: Number(my_id),
      },
    },
    select: {
      user: {
        select: {
          user_id: true,
          name: true,
          email: true,
          active_status: true,
          Role: true,
        },
      },
    },
    distinct: ['user_id'],
  });

  const users = conversationUserList.map(item => item.user);

  res.status(200).json({
    success: true,
    users: users,
  })

})

export const getChatsUser = catchAsyncError(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Search query is required.",
    });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      user_id: true,
      name: true,
      email: true,
      active_status: true,
    },
  });

  res.status(200).json({
    success: true,
    users,
  });
});

// Get project group chat messages
export const getProjectChatMessages = catchAsyncError(async (req, res, next) => {
  const { project_id } = req.params;
  const user_id = req.user.user_id;

  // Verify user is a member of the project
  const projectMember = await prisma.projectMember.findFirst({
    where: {
      project_id: parseInt(project_id),
      user_id: parseInt(user_id)
    }
  });

  if (!projectMember) {
    return res.status(403).json({
      success: false,
      message: 'You are not a member of this project'
    });
  }

  // Get or create project group conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      project_id: parseInt(project_id),
      isGroup: true
    }
  });

  if (!conversation) {
    // Create new group conversation with all project members
    const projectMembers = await prisma.projectMember.findMany({
      where: { project_id: parseInt(project_id) },
      select: { user_id: true }
    });

    conversation = await prisma.conversation.create({
      data: {
        project_id: parseInt(project_id),
        isGroup: true,
        name: `Project ${project_id} Chat`,
        participants: {
          create: projectMembers.map(member => ({ user_id: member.user_id }))
        }
      }
    });
  }

  // Get messages with sender information
  const messages = await prisma.message.findMany({
    where: {
      conversation_id: conversation.conversation_id
    },
    include: {
      sender: {
        select: {
          name: true,
          user_id: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Format messages
  const formattedMessages = messages.map(message => ({
    message_id: message.message_id,
    project_id: parseInt(project_id),
    sender_id: message.sender_id,
    sender_name: message.sender.name,
    content: message.content,
    content_type: message.content_type,
    createdAt: message.createdAt
  }));

  res.status(200).json({
    success: true,
    messages: formattedMessages,
    conversation_id: conversation.conversation_id
  });
});

// Test endpoint to check if messages are being saved
export const testMessageSaving = catchAsyncError(async (req, res, next) => {
  const { conversation_id, sender_id, reciever_id, content } = req.body;

  try {
    const testMessage = await prisma.message.create({
      data: {
        conversation_id: conversation_id,
        sender_id: parseInt(sender_id),
        reciever_id: reciever_id ? parseInt(reciever_id) : null,
        content: content,
        content_type: "PLAIN_TEXT",
        is_group_chat: false
      }
    });

    res.status(200).json({
      success: true,
      message: 'Test message saved successfully',
      savedMessage: testMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test message saving failed',
      error: error.message
    });
  }
});

// ============================================
// Custom Group Chat Functions
// ============================================

// Create a custom group chat
export const createCustomGroup = catchAsyncError(async (req, res, next) => {
  const { name, user_ids } = req.body;
  const userId = req.user.user_id;

  if (!name || !name.trim()) {
    return next(new ErrorHandler('Group name is required', 400));
  }

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return next(new ErrorHandler('At least one member is required', 400));
  }

  // Include the creator in the group
  const allUserIds = [...new Set([userId, ...user_ids.map(id => parseInt(id))])];

  // Create conversation for custom group
  // Use task_id: -2 to distinguish from project groups (which use -1)
  const conversation = await prisma.conversation.create({
    data: {
      name: name.trim(),
      isGroup: true,
      task_id: -2, // Custom group identifier
      project_id: null, // null for custom groups
      participants: {
        create: allUserIds.map(user_id => ({ user_id }))
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    group: {
      conversation_id: conversation.conversation_id,
      name: conversation.name,
      isGroup: conversation.isGroup,
      participants: conversation.participants.map(p => ({
        user_id: p.user.user_id,
        name: p.user.name,
        email: p.user.email
      }))
    }
  });
});

// Get all custom groups for the current user
export const getCustomGroups = catchAsyncError(async (req, res, next) => {
  const userId = req.user.user_id;

  const groups = await prisma.conversation.findMany({
    where: {
      isGroup: true,
      task_id: -2, // Custom groups
      project_id: null, // No project association
      participants: {
        some: {
          user_id: userId
        }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      last_message: 'desc' // Sort by last message time (if available)
    }
  });

  const formattedGroups = groups.map(group => ({
    conversation_id: group.conversation_id,
    name: group.name,
    last_message: group.last_message,
    participants: group.participants.map(p => ({
      user_id: p.user.user_id,
      name: p.user.name,
      email: p.user.email
    }))
  }));

  res.status(200).json({
    success: true,
    groups: formattedGroups
  });
});

// Get messages for a custom group
export const getCustomGroupMessages = catchAsyncError(async (req, res, next) => {
  const { group_id } = req.params;
  const userId = req.user.user_id;

  // Verify user is a participant in this group
  const participant = await prisma.participant.findFirst({
    where: {
      conversation_id: group_id,
      user_id: userId
    }
  });

  if (!participant) {
    return next(new ErrorHandler('You are not a member of this group', 403));
  }

  // Verify it's a custom group
  const conversation = await prisma.conversation.findFirst({
    where: {
      conversation_id: group_id,
      task_id: -2,
      project_id: null,
      isGroup: true
    }
  });

  if (!conversation) {
    return next(new ErrorHandler('Group not found', 404));
  }

  // Get messages
  const messages = await prisma.message.findMany({
    where: {
      conversation_id: group_id,
      is_group_chat: true
    },
    include: {
      sender: {
        select: {
          user_id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const formattedMessages = messages.map(message => ({
    message_id: message.message_id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    sender_name: message.sender?.name || 'Unknown',
    content: message.content,
    content_type: message.content_type,
    createdAt: message.createdAt,
    is_group_chat: message.is_group_chat,
    attachment_url: message.attachment_url,
    attachment_name: message.attachment_name,
    attachment_size: message.attachment_size,
    attachment_mime_type: message.attachment_mime_type
  }));

  res.status(200).json({
    success: true,
    messages: formattedMessages
  });
});

// Send message to custom group
export const sendCustomGroupMessage = catchAsyncError(async (req, res, next) => {
  const { group_id } = req.params;
  const { content, content_type = 'PLAIN_TEXT' } = req.body;
  const userId = req.user.user_id;
  const file = req.file;

  // Verify user is a participant
  const participant = await prisma.participant.findFirst({
    where: {
      conversation_id: group_id,
      user_id: userId
    }
  });

  if (!participant) {
    return next(new ErrorHandler('You are not a member of this group', 403));
  }

  // Verify it's a custom group
  const conversation = await prisma.conversation.findFirst({
    where: {
      conversation_id: group_id,
      task_id: -2,
      project_id: null,
      isGroup: true
    },
    include: {
      participants: true
    }
  });

  if (!conversation) {
    return next(new ErrorHandler('Group not found', 404));
  }

  // Handle file upload if present
  let attachmentData = {};
  if (file) {
    const cloudRes = await uploadToCloud(file);
    attachmentData = {
      attachment_url: cloudRes.url,
      attachment_name: file.originalname,
      attachment_size: file.buffer.length,
      attachment_mime_type: file.mimetype
    };
  }

  // Get sender info
  const sender = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { name: true, email: true }
  });

  // Create message
  const message = await prisma.message.create({
    data: {
      conversation_id: group_id,
      sender_id: userId,
      content: content,
      content_type: content_type,
      is_group_chat: true,
      project_id: null, // Custom groups have no project
      task_id: -2, // Custom group identifier
      ...attachmentData
    }
  });

  // Update conversation last message
  await prisma.conversation.update({
    where: {
      conversation_id: group_id
    },
    data: {
      last_message: content
    }
  });

  // Format message for response and broadcasting
  const formattedMessage = {
    message_id: message.message_id,
    conversation_id: group_id,
    sender_id: userId,
    sender_name: sender?.name || 'Unknown',
    content: content,
    content_type: content_type,
    createdAt: message.createdAt,
    is_group_chat: true,
    attachment_url: message.attachment_url,
    attachment_name: message.attachment_name,
    attachment_size: message.attachment_size,
    attachment_mime_type: message.attachment_mime_type
  };

  res.status(201).json({
    success: true,
    message: formattedMessage
  });
});

// Add members to custom group
export const addGroupMembers = catchAsyncError(async (req, res, next) => {
  const { group_id } = req.params;
  const { user_ids } = req.body;
  const userId = req.user.user_id;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return next(new ErrorHandler('At least one user ID is required', 400));
  }

  // Verify user is a participant (and optionally check if they're admin/creator)
  const participant = await prisma.participant.findFirst({
    where: {
      conversation_id: group_id,
      user_id: userId
    }
  });

  if (!participant) {
    return next(new ErrorHandler('You are not a member of this group', 403));
  }

  // Verify it's a custom group
  const conversation = await prisma.conversation.findFirst({
    where: {
      conversation_id: group_id,
      task_id: -2,
      project_id: null,
      isGroup: true
    }
  });

  if (!conversation) {
    return next(new ErrorHandler('Group not found', 404));
  }

  // Get existing participants
  const existingParticipants = await prisma.participant.findMany({
    where: {
      conversation_id: group_id
    },
    select: {
      user_id: true
    }
  });

  const existingUserIds = existingParticipants.map(p => p.user_id);
  const newUserIds = user_ids
    .map(id => parseInt(id))
    .filter(id => !existingUserIds.includes(id));

  if (newUserIds.length === 0) {
    return next(new ErrorHandler('All users are already members of this group', 400));
  }

  // Add new participants
  await prisma.participant.createMany({
    data: newUserIds.map(user_id => ({
      conversation_id: group_id,
      user_id
    }))
  });

  res.status(200).json({
    success: true,
    message: `Added ${newUserIds.length} member(s) to the group`
  });
});

// Remove member from custom group
export const removeGroupMember = catchAsyncError(async (req, res, next) => {
  const { group_id, user_id } = req.params;
  const currentUserId = req.user.user_id;

  const targetUserId = parseInt(user_id);

  // Verify it's a custom group
  const conversation = await prisma.conversation.findFirst({
    where: {
      conversation_id: group_id,
      task_id: -2,
      project_id: null,
      isGroup: true
    }
  });

  if (!conversation) {
    return next(new ErrorHandler('Group not found', 404));
  }

  // Users can remove themselves, or we can add admin check later
  if (targetUserId !== currentUserId) {
    // For now, allow any member to remove others (you can add admin logic later)
    const currentUserParticipant = await prisma.participant.findFirst({
      where: {
        conversation_id: group_id,
        user_id: currentUserId
      }
    });

    if (!currentUserParticipant) {
      return next(new ErrorHandler('You are not a member of this group', 403));
    }
  }

  // Remove participant
  await prisma.participant.deleteMany({
    where: {
      conversation_id: group_id,
      user_id: targetUserId
    }
  });

  res.status(200).json({
    success: true,
    message: 'Member removed from group'
  });
});
