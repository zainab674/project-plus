import express from 'express';
const router = express.Router();
import userRouter from './userRoute.js';
import projectRouter from './projectRoute.js';
import taskRouter from './taskRoute.js';
import notificationRouter from './notificationRoute.js';
import chatRouter from './chatRoute.js';
import meetingRoute from './meetingRoute.js'
import mediaRoute from './mediaRoute.js'
import twilioRoute from './twilioRoute.js'
import clientRoute from './clientRoute.js'
import reviewRouter from './reviewRoute.js'
import billingRouter from './billingRoute.js'
import privateChatRouter from './privateChatRoute.js'
import expensesRouter from './expensesRoute.js'
import adminRouter from './adminRoute.js'
import callRouter from './callRoute.js'
import contactRouter from './contactRoute.js'
import transcriptionRouter from './transcriptionRoute.js'

router.use('/user',userRouter);
router.use('/project',projectRouter);
router.use('/task',taskRouter);
router.use('/notificaion',notificationRouter);
router.use('/chat',chatRouter);
router.use('/meeting',meetingRoute);
router.use('/media',mediaRoute);
router.use('/twilio',twilioRoute);
router.use('/client',clientRoute);
router.use('/review',reviewRouter);
router.use('/billing',billingRouter);
router.use('/private-chat',privateChatRouter);
router.use('/expenses',expensesRouter);
router.use('/admin',adminRouter);
router.use('/calls',callRouter);
router.use('/contacts',contactRouter);
router.use('/transcription',transcriptionRouter);


export default router;