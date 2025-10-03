// import express from 'express';
// import router from './routes/index.js';
// import cookieParser from 'cookie-parser';
// import cors from 'cors';
// import { config } from 'dotenv';
// import ErrorMiddleware from './middlewares/error.js'
// import initChatServer from './config/chatServerConfig.js';
// import http from 'http';
// import { Server } from "socket.io";
// import initTranscribeServer from './config/transcribeServerConfig.js';
// import passport from 'passport';
// import { ensureTopicsExist } from "./services/kafkaService.js";

// config();


// // await ensureTopicsExist(); // Call this before initChatConsumer()



// const app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use(cors({
//     origin: [process.env.FRONTEND_URL],
//     credentials: true
// }));
// app.use(passport.initialize());
// app.use('/api/v1/', router);
// app.use(ErrorMiddleware);

// const PORT = process.env.PORT || 4000;

// const httpserver = http.createServer(app);

// const io = new Server({
//     cors: {
//         allowedHeaders: ["*"],
//         origin: "*",
//     },
// });
// io.attach(httpserver);


// const chatIO = io.of('/chat');
// initChatServer(chatIO);

// // const transcribeIO = io.of('/transcribe');
// // initTranscribeServer(transcribeIO);

// httpserver.listen(PORT, () => {
//     console.log(`server running: http://localhost:${PORT}`);
// });



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

console.log("🚀 Server is booting...");
console.log("🌍 Environment:", process.env.NODE_ENV);
console.log("🔗 Frontend URL:", process.env.FRONTEND_URL);
console.log("🔒 CORS Origins:", [
    process.env.FRONTEND_URL,
    'https://flexy-frontend-7g998n9cm-zainabs-projects-02346087.vercel.app',
    'https://flexy-frontend.vercel.app',
    'https://flexywexy.vercel.app'
]);

app.get("/", (req, res) => {
    console.log("✅ Root route hit");
    res.send("welcome to backend");
});

// Test endpoint to manually trigger email polling
app.get('/test/email-poll', async (req, res) => {
    try {
        console.log('🔄 Manual email polling triggered via API');
        await emailPollingService.manualPoll();
        res.json({ success: true, message: 'Email polling triggered manually' });
    } catch (error) {
        console.error('❌ Error in manual email polling:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test endpoint for chat notifications
app.get('/test/chat-notifications', async (req, res) => {
    try {
        console.log('🔍 Testing chat notifications...');
        
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
        console.error('❌ Error testing chat notifications:', error);
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
    console.log(`server running: http://localhost:${PORT}`);
    
    // Start email polling service
    console.log('📧 Starting email polling service...');
    emailPollingService.start();

    console.log('🚀 Server started successfully!');
    console.log(`🌐 Backend running at: http://localhost:${PORT}`);
    console.log(`📱 API endpoints available at: http://localhost:${PORT}/api/v1/`);
    
    // Start ngrok tunnel for webhook testing
    try {
        const ngrokUrl = await ngrokService.startTunnel(PORT);
        if (ngrokUrl) {
            console.log('🎉 ngrok tunnel ready for Twilio webhooks!');
            console.log('📋 Copy the TwiML Voice Webhook URL to your Twilio Console');
        } else {
            console.log('💡 ngrok tunnel failed - you can still test locally');
            console.log('💡 For Twilio webhooks, manually start ngrok: ngrok http 4000');
        }
    } catch (error) {
        console.error('❌ ngrok startup error:', error.message);
        console.log('💡 You can manually start ngrok: ngrok http 4000');
    }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal, isError = false) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    try {
        // Stop ngrok tunnel
        await ngrokService.stopTunnel();
        
        // Stop email polling service
        emailPollingService.stop();
        console.log('✅ Email polling service stopped');
        
        // Close HTTP server with timeout
        const httpClosePromise = new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('⚠️ HTTP server close timeout, forcing close');
                resolve();
            }, 5000);
            
            httpserver.close(() => {
                clearTimeout(timeout);
                console.log('✅ HTTP server closed');
                resolve();
            });
        });
        
        // Close Socket.IO connections with timeout
        const socketClosePromise = new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('⚠️ Socket.IO close timeout, forcing close');
                resolve();
            }, 5000);
            
            io.close(() => {
                clearTimeout(timeout);
                console.log('✅ Socket.IO server closed');
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
        console.log('✅ Database connection closed');
        
        console.log('🎉 Graceful shutdown completed');
        
        // Exit with appropriate code
        if (isError) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    
    // For critical errors, exit immediately without graceful shutdown
    // This prevents the NodeError constructor issue
    console.error('🛑 Critical error detected. Exiting immediately...');
    
    // Force exit after a short delay to allow logging
    setTimeout(() => {
        process.exit(1);
    }, 100);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    
    // For unhandled rejections, try graceful shutdown but with error flag
    gracefulShutdown('unhandledRejection', true);
});

// Additional error handling for Node.js internal errors
process.on('exit', (code) => {
    console.log(`\n🚪 Process exiting with code: ${code}`);
});

// Handle process warnings
process.on('warning', (warning) => {
    console.warn('⚠️ Process warning:', warning.name, warning.message);
});

