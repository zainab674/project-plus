import { config } from "dotenv";
import { Redis } from "ioredis";
import { userSocketMap } from "../constants/userSocketMapConstant.js";
import { ON_CALL, ON_CALL_ANSWER, ON_CALL_END, ON_CALL_NO_RESPONSE, ON_DISCONNET, ON_MESSAGE, ON_PRIVATE_MESSAGE, ON_SIGNAL, ON_JOIN_PROJECT_ROOM, ON_LEAVE_PROJECT_ROOM, ON_PROJECT_MESSAGE } from "../constants/chatEventConstant.js";
import { handelNoResponse, handleCall, handleCallAnswer, handleCallEnd, handleCallSignal, handleDisconnect, handleMessage, handlePrivateMessage, initRedisSubcriber, updateActiveStatus, handleJoinProjectRoom, handleLeaveProjectRoom, handleProjectMessage } from "../services/chatService.js";
import { initChatConsumer } from "../services/kafkaService.js";

config();

const initChatServer = (io) => {
  const redisConfig = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASS,
    tls: {} // Required for secure connection
  };

  let redisPub, redisSub;

  if (redisConfig.host && redisConfig.password) {
    redisPub = new Redis(redisConfig);
    redisSub = new Redis(redisConfig);

    //subscribe redis
    initRedisSubcriber(redisSub, io);
    initChatConsumer();
  } else {
    console.log('Redis not configured, running without Redis');
  }

  io.on("connection", (socket) => {
    console.log('🔌 New socket connection:', socket.id);

    //save user socket id
    const config = socket.handshake.query;
    const user_id = config.user_id;

    console.log('🔌 User ID from query:', user_id);
    console.log('🔌 Socket ID:', socket.id);

    if (user_id) {
      //change user active status on db - pending
      updateActiveStatus("Online", user_id);
      
      // Join user's personal room for email notifications
      socket.join(`user_${user_id}`);
      console.log(`🔌 User ${user_id} joined personal notification room`);
    }

    userSocketMap.set(user_id, socket.id);
    console.log('🔌 User socket map updated. Size:', userSocketMap.size);
    console.log('🔌 User socket map keys:', Array.from(userSocketMap.keys()));

    // Chat events
    socket.on(ON_DISCONNET, () => handleDisconnect(config));
    socket.on(ON_MESSAGE, (data) => handleMessage(data, redisPub, io));
    socket.on(ON_PRIVATE_MESSAGE, (data) => handlePrivateMessage(data, redisPub, io));
    socket.on(ON_CALL, (data) => handleCall(data, redisPub));
    socket.on(ON_CALL_ANSWER, (data) => handleCallAnswer(data, redisPub));
    socket.on(ON_SIGNAL, (data) => handleCallSignal(data, redisPub));
    socket.on(ON_CALL_END, (data) => handleCallEnd(data, redisPub));
    socket.on(ON_CALL_NO_RESPONSE, (data) => handelNoResponse(data, redisPub));

    // Project Group Chat Events
    socket.on(ON_JOIN_PROJECT_ROOM, (data) => handleJoinProjectRoom(data, socket, io));
    socket.on(ON_LEAVE_PROJECT_ROOM, (data) => handleLeaveProjectRoom(data, socket, io));
    socket.on(ON_PROJECT_MESSAGE, (data) => handleProjectMessage(data, redisPub, io));

    // Email notification events
    socket.on('request_email_count', (data) => {
      console.log('📧 Email count requested for user:', data.user_id);
      // This will be handled by the email polling service
    });

    socket.on('mark_email_read', (data) => {
      console.log('📧 Mark email as read:', data);
      // This will be handled by the email polling service
    });

    socket.on('mark_email_unread', (data) => {
      console.log('📧 Mark email as unread:', data);
      // This will be handled by the email polling service
    });

    socket.on('delete_email', (data) => {
      console.log('📧 Delete email:', data);
      // This will be handled by the email polling service
    });

    socket.on('archive_email', (data) => {
      console.log('📧 Archive email:', data);
      // This will be handled by the email polling service
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
      if (user_id) {
        // Leave personal room
        socket.leave(`user_${user_id}`);
        console.log(`🔌 User ${user_id} left personal notification room`);
      }
    });

  });
};

export default initChatServer;