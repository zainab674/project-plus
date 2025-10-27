

import express from 'express';
import router from './routes/index.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from 'dotenv';
import ErrorMiddleware from './middlewares/error.js'
import initChatServer from './config/chatServerConfig.js';
import http from 'http';
import { Server } from "socket.io";
import initTranscribeServer from './config/transcribeServerConfig.js';
import { initDirectTranscriptionServer } from './services/directTranscriptionService.js';
import passport from 'passport';
import { ensureTopicsExist } from "./services/kafkaService.js";
import { prisma } from './prisma/index.js';
import compression from 'compression';
import emailPollingService from './services/emailPollingService.js';
import chatNotificationService from './services/chatNotificationService.js';
import ngrokService from './services/ngrokService.js';

config();

// Validate critical environment variables on startup
const requiredEnvVars = {
    'LIVEKIT_URL': process.env.LIVEKIT_URL,
    'LIVEKIT_HOST': process.env.LIVEKIT_HOST,
    'LIVEKIT_API_KEY': process.env.LIVEKIT_API_KEY,
    'LIVEKIT_API_SECRET': process.env.LIVEKIT_API_SECRET,
    'JWT_SECRET': process.env.JWT_SECRET,
    'DATABASE_URL': process.env.DATABASE_URL
};

const missingVars = [];
const livekitUrlOrHost = process.env.LIVEKIT_URL || process.env.LIVEKIT_HOST;

// Check LiveKit configuration
if (!livekitUrlOrHost) {
    missingVars.push('LIVEKIT_URL or LIVEKIT_HOST');
} else {
}

// Check other required variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (key === 'LIVEKIT_URL' || key === 'LIVEKIT_HOST') {
        continue; // Already checked above
    }
    
    if (!value) {
        missingVars.push(key);
    } else {
    }
}

if (missingVars.length > 0) {
    if (process.env.NODE_ENV === 'production') {
    }
} else {
}

// await ensureTopicsExist(); // Call this before initChatConsumer()

const app = express();

// Add compression middleware for better performance
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        'https://flexy-frontend-7g998n9cm-zainabs-projects-02346087.vercel.app',
        'https://flexy-frontend.vercel.app',
        'https://flexywexy.vercel.app',
        'http://localhost:3000', // For local development
        'http://localhost:3001'  // For local development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.use(passport.initialize());
app.use('/api/v1/', router);
app.use(ErrorMiddleware);


app.get("/", (req, res) => {
    res.send("welcome to backend");
});

// Test endpoint to manually trigger email polling
app.get('/test/email-poll', async (req, res) => {
    try {
        await emailPollingService.manualPoll();
        res.json({ success: true, message: 'Email polling triggered manually' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test endpoint for chat notifications
app.get('/test/chat-notifications', async (req, res) => {
    try {
        
        // Test private message notification
        await chatNotificationService.notifyPrivateMessage({
            sender_id: 1,
            reciever_id: 2,
            content: 'This is a test private message',
            sender_name: 'Test User'
        });
        
        // Test group message notification
        await chatNotificationService.notifyGroupMessage({
            sender_id: 1,
            content: 'This is a test group message',
            sender_name: 'Test User',
            project_id: 1
        });
        
        // Test project message notification
        await chatNotificationService.notifyProjectMessage({
            sender_id: 1,
            content: 'This is a test project message',
            sender_name: 'Test User',
            project_id: 1
        });
        
        // Test public message notification
        await chatNotificationService.notifyPublicMessage({
            sender_id: 1,
            content: 'This is a test public message',
            sender_name: 'Test User',
            conversation_id: 'public-1'
        });
        
        // Test system message notification
        await chatNotificationService.notifySystemMessage({
            title: 'Test System Message',
            body: 'This is a test system notification',
            priority: 'high',
            icon: '🔔'
        });
        
        res.json({ 
            success: true, 
            message: 'All chat notification types tested successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 4000;

const httpserver = http.createServer(app);

const io = new Server({
    cors: {
        allowedHeaders: ["*"],
        origin: "*",
    },
});
io.attach(httpserver);

const chatIO = io.of('/chat');
initChatServer(chatIO);

// Set io instance for email polling service
emailPollingService.setIO(chatIO); // Use chatIO instead of main io

// Set io instance for chat notification service
chatNotificationService.setIO(chatIO);

// const transcribeIO = io.of('/transcribe');
// initTranscribeServer(transcribeIO);

// Direct transcription server (bypasses Kafka/Redis)
const directTranscribeIO = io.of('/transcription-direct');
initDirectTranscriptionServer(directTranscribeIO);

httpserver.listen(PORT, async () => {
    
    // Start email polling service
    emailPollingService.start();

    // Start ngrok tunnel for webhook testing
    try {
        const ngrokUrl = await ngrokService.startTunnel(PORT);
        if (ngrokUrl) {
        } else {
        }
    } catch (error) {
    }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal, isError = false) => {
    
    try {
        // Stop ngrok tunnel
        await ngrokService.stopTunnel();
        
        // Stop email polling service
        emailPollingService.stop();
        
        // Close HTTP server with timeout
        const httpClosePromise = new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve();
            }, 5000);
            
            httpserver.close(() => {
                clearTimeout(timeout);
                resolve();
            });
        });
        
        // Close Socket.IO connections with timeout
        const socketClosePromise = new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve();
            }, 5000);
            
            io.close(() => {
                clearTimeout(timeout);
                resolve();
            });
        });
        
        // Wait for both to close with timeout
        await Promise.race([
            Promise.all([httpClosePromise, socketClosePromise]),
            new Promise(resolve => setTimeout(resolve, 10000)) // 10 second max wait
        ]);
        
        // Close Prisma connection
        await prisma.$disconnect();

        // Exit with appropriate code
        if (isError) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (error) {
        process.exit(1);
    }
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    
    // For critical errors, exit immediately without graceful shutdown
    // This prevents the NodeError constructor issue
    
    // Force exit after a short delay to allow logging
    setTimeout(() => {
        process.exit(1);
    }, 100);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    
    // For unhandled rejections, try graceful shutdown but with error flag
    gracefulShutdown('unhandledRejection', true);
});

// Additional error handling for Node.js internal errors
process.on('exit', (code) => {
});

// Handle process warnings
process.on('warning', (warning) => {
});

