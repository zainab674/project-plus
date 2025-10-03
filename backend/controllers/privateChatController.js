import catchAsyncError from "../middlewares/catchAsyncError.js";
import { prisma } from "../prisma/index.js";
import { uploadToCloud } from '../services/mediaService.js';

// Get or create private conversation between two users
export const getOrCreatePrivateConversation = catchAsyncError(async (req, res, next) => {
  const { user_id } = req.body;
  const my_id = req.user.user_id;

  // Ensure user_id is a number
  const targetUserId = parseInt(user_id);
  const currentUserId = parseInt(my_id);

  // Find existing private conversation (without task dependency)
  let conversation = await prisma.privateConversation.findFirst({
    where: {
      OR: [
        {
          user1_id: currentUserId,
          user2_id: targetUserId
        },
        {
          user1_id: targetUserId,
          user2_id: currentUserId
        }
      ]
    },
    include: {
      messages: {
        include: {
          sender: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          receiver: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      }
    }
  });

  if (!conversation) {
    // Create conversation without task_id (private conversations don't need tasks)
    conversation = await prisma.privateConversation.create({
      data: {
        user1_id: currentUserId,
        user2_id: targetUserId,
        task_id: null // Private conversations don't require a task
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                user_id: true,
                name: true,
                email: true
              }
            },
            receiver: {
              select: {
                user_id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            created_at: 'asc'
          }
        }
      }
    });
  }

  res.status(200).json({
    success: true,
    conversation: {
      private_conversation_id: conversation.private_conversation_id,
      messages: conversation.messages
    }
  });
});

// Get private conversation messages
export const getPrivateConversationMessages = catchAsyncError(async (req, res, next) => {
  const { private_conversation_id } = req.params;
  const my_id = req.user.user_id;

  // Verify user is part of this conversation
  const conversation = await prisma.privateConversation.findFirst({
    where: {
      private_conversation_id: private_conversation_id,
      OR: [
        { user1_id: my_id },
        { user2_id: my_id }
      ]
    },
    include: {
      messages: {
        include: {
          sender: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          receiver: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      }
    }
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found or access denied'
    });
  }

  res.status(200).json({
    success: true,
    messages: conversation.messages
  });
});

// Save private message
export const savePrivateMessage = catchAsyncError(async (req, res, next) => {
  const { private_conversation_id, content, receiver_id, temp_message_id } = req.body;
  const sender_id = req.user.user_id;
  const file = req.file;

  // Verify user is part of this conversation
  const conversation = await prisma.privateConversation.findFirst({
    where: {
      private_conversation_id: private_conversation_id,
      OR: [
        { user1_id: sender_id },
        { user2_id: sender_id }
      ]
    }
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found or access denied'
    });
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

  // Save the message
  const message = await prisma.privateMessage.create({
    data: {
      private_conversation_id: private_conversation_id,
      sender_id: parseInt(sender_id),
      receiver_id: parseInt(receiver_id),
      content: content,
      content_type: 'PLAIN_TEXT',
      ...attachmentData
    },
    include: {
      sender: {
        select: {
          user_id: true,
          name: true,
          email: true
        }
      },
      receiver: {
        select: {
          user_id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Update conversation updated_at
  await prisma.privateConversation.update({
    where: {
      private_conversation_id: private_conversation_id
    },
    data: {
      updated_at: new Date()
    }
  });

  res.status(200).json({
    success: true,
    message: {
      ...message,
      temp_message_id: temp_message_id // Include temp_message_id in response
    }
  });
});

// Get user's private conversations list
export const getPrivateConversationsList = catchAsyncError(async (req, res, next) => {
  const my_id = req.user.user_id;

  const conversations = await prisma.privateConversation.findMany({
    where: {
      OR: [
        { user1_id: my_id },
        { user2_id: my_id }
      ]
    },
    include: {
      user1: {
        select: {
          user_id: true,
          name: true,
          email: true
        }
      },
      user2: {
        select: {
          user_id: true,
          name: true,
          email: true
        }
      },
      messages: {
        orderBy: {
          created_at: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      updated_at: 'desc'
    }
  });

  // Format the response to show the other user and last message
  const formattedConversations = conversations.map(conv => {
    const otherUser = conv.user1_id === my_id ? conv.user2 : conv.user1;
    const lastMessage = conv.messages[0] || null;

    return {
      private_conversation_id: conv.private_conversation_id,
      other_user: otherUser,
      last_message: lastMessage,
      updated_at: conv.updated_at
    };
  });

  res.status(200).json({
    success: true,
    conversations: formattedConversations
  });
}); 