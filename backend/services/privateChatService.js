import { prisma } from "../prisma/index.js";
import { RedisEvent } from "../constants/redisEventConstant.js";
import { userSocketMap } from "../constants/userSocketMapConstant.js";

// Handle private message via socket
export const handlePrivateMessage = async (data, redisPub, io) => {


  // Add a simple deduplication check using message content and sender
  const messageKey = `${data.private_conversation_id}-${data.sender_id}-${data.content}`;
  if (global.processedMessages && global.processedMessages.has(messageKey)) {
    return;
  }

  // Store this message as processed
  if (!global.processedMessages) {
    global.processedMessages = new Set();
  }
  global.processedMessages.add(messageKey);

  // Clean up old messages after 5 seconds to prevent memory leaks
  setTimeout(() => {
    global.processedMessages.delete(messageKey);
  }, 5000);

  try {
    // Save message to database


    const savedMessage = await prisma.privateMessage.create({
      data: {
        private_conversation_id: data.private_conversation_id,
        sender_id: parseInt(data.sender_id),
        receiver_id: parseInt(data.receiver_id),
        content: data.content,
        content_type: data.content_type || 'PLAIN_TEXT'
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


    // Prepare broadcast data
    const broadcastData = {
      message_id: savedMessage.private_message_id, // Frontend expects message_id
      private_message_id: savedMessage.private_message_id,
      private_conversation_id: savedMessage.private_conversation_id,
      sender_id: savedMessage.sender_id,
      receiver_id: savedMessage.receiver_id,
      content: savedMessage.content,
      content_type: savedMessage.content_type,
      created_at: savedMessage.created_at,
      createdAt: savedMessage.created_at, // Frontend expects createdAt
      sender: savedMessage.sender,
      receiver: savedMessage.receiver,
      // Preserve original data
      sender_name: data.sender_name,
      task_name: data.task_name,
      task_id: data.task_id
    };


    // Publish to Redis for other server instances
    if (redisPub) {
      const redisData = {
        ...broadcastData,
        event: 'on:private_message'
      };
      redisPub.publish('on_private_publish', JSON.stringify(redisData));
    }

    // Emit directly to receiver if connected
    const receiverSocketId = userSocketMap.get(data.receiver_id.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('on:private_message', broadcastData);
    } else {
    }

    // Also emit to sender for confirmation
    const senderSocketId = userSocketMap.get(data.sender_id.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit('on:private_message', broadcastData);
    }

  } catch (error) {
    console.error('❌ Error handling private message:', error);
  }
};

// Initialize Redis subscriber for private messages
export const initPrivateChatRedisSubscriber = (redisSub, io) => {
  if (!redisSub) {
    return;
  }


  redisSub.subscribe('on_private_publish', (err) => {
    if (err) {
      console.error('❌ Error subscribing to private chat Redis channel:', err);
      return;
    }
  });

  redisSub.on('message', (channel, message) => {
    if (channel === 'on_private_publish') {
      try {
        const parseMessage = JSON.parse(message);


        if (parseMessage.event === 'on:private_message') {
          const receiver_id = parseMessage.receiver_id;
          const sender_id = parseMessage.sender_id;



          // Emit to receiver
          let receiverSocketId = userSocketMap.get(receiver_id.toString());
          if (!receiverSocketId) {
            receiverSocketId = userSocketMap.get(parseInt(receiver_id));
          }



          if (receiverSocketId) {
            io.to(receiverSocketId).emit('on:private_message', parseMessage);
          } else {

          }

          // Also emit to sender for confirmation
          let senderSocketId = userSocketMap.get(sender_id.toString());
          if (!senderSocketId) {
            senderSocketId = userSocketMap.get(parseInt(sender_id));
          }

          if (senderSocketId) {
            io.to(senderSocketId).emit('on:private_message', parseMessage);
          }
        }
      } catch (error) {
        console.error('❌ Error processing private Redis message:', error);
      }
    }
  });
}; 