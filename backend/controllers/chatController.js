import catchAsyncError from '../middlewares/catchAsyncError.js';
import { prisma } from "../prisma/index.js";

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
    console.error('❌ Test message saving failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test message saving failed',
      error: error.message
    });
  }
});
