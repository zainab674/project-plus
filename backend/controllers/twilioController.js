import "dotenv/config"
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import { generateToken } from "../services/twilioService.js";
import twilio from "twilio";
import ngrokService from '../services/ngrokService.js';
import CallService from '../services/callService.js';
import ContactService from '../services/contactService.js';
import { transcribeFile } from '../services/taskService.js';
import { prisma } from '../prisma/index.js';

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const createToken = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.user_id; // Get user ID from authenticated user
        const token = await generateToken("+19862108561", userId);
        res.status(200).json(token);
    } catch (error) {
        return next(new ErrorHandler(`Token generation failed: ${error.message}`, 500));
    }
});

// TwiML webhook endpoint for handling voice calls
export const handleVoiceWebhook = catchAsyncError(async (req, res, next) => {
    try {
        
        const twiml = new twilio.twiml.VoiceResponse();
        
        // Get the 'To' number from the call parameters
        const toNumber = req.body.To;
        const fromNumber = req.body.From;

        // Dial the destination number
        const dial = twiml.dial({
            callerId: fromNumber, // Use the 'From' number as caller ID
            timeout: 30, // Wait up to 30 seconds for answer
            record: 'record-from-answer', // Record the call
            recordingStatusCallback: `${process.env.BASE_URL || 'http://localhost:3000'}/api/v1/twilio/recording-status`
        });
        
        dial.number(toNumber);
        
        // If no answer, play a message
        twiml.say('The call could not be completed. Please try again later.');
        
        res.type('text/xml');
        res.send(twiml.toString());
        
    } catch (error) {
        
        // Return a basic TwiML response even if there's an error
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('Sorry, there was an error processing your call.');
        twiml.hangup();
        
        res.type('text/xml');
        res.send(twiml.toString());
    }
});

// Recording status webhook
export const handleRecordingStatus = catchAsyncError(async (req, res, next) => {
    try {
        
        const { CallSid, RecordingStatus, RecordingUrl, RecordingDuration } = req.body;
        
        if (RecordingStatus === 'completed') {
            
            // Update call record in database
            const updateResult = await CallService.processWebhookData({
                CallSid,
                CallStatus: 'completed',
                RecordingUrl,
                RecordingDuration
            });
            
            if (updateResult.success) {
                
                // Start transcription process in background
                if (RecordingUrl) {
                    transcribeCallRecording(CallSid, RecordingUrl).catch(error => {
                    });
                }
            } else {
            }
        }
        
        res.status(200).send('OK');
        
    } catch (error) {
        res.status(200).send('OK'); // Always return OK to Twilio
    }
});

// Call status webhook for real-time updates
export const handleCallStatus = catchAsyncError(async (req, res, next) => {
    try {
        
        const { 
            CallSid, 
            CallStatus, 
            CallDuration,
            From,
            To,
            Direction
        } = req.body;
        
        if (CallSid) {
            
            // Update call record in database
            const updateData = {
                CallSid,
                CallStatus,
                CallDuration,
                From,
                To,
                Direction
            };
            
            const updateResult = await CallService.processWebhookData(updateData);
            
            if (updateResult.success) {
            } else {
            }
        }
        
        res.status(200).send('OK');
        
    } catch (error) {
        res.status(200).send('OK'); // Always return OK to Twilio
    }
});

// Get ngrok tunnel information
export const getNgrokInfo = catchAsyncError(async (req, res, next) => {
    try {
        const webhookUrls = ngrokService.getWebhookUrls();
        
        res.status(200).json({
            success: true,
            isConnected: ngrokService.isTunnelActive(),
            publicUrl: ngrokService.getUrl(),
            webhookUrls: webhookUrls,
            message: ngrokService.isTunnelActive() 
                ? 'ngrok tunnel is active' 
                : 'ngrok tunnel is not active'
        });
    } catch (error) {
        return next(new ErrorHandler(`Failed to get ngrok info: ${error.message}`, 500));
    }
});

// Get available phone numbers from Twilio
export const getAvailableNumbers = catchAsyncError(async (req, res, next) => {
    try {
        const { 
            country = 'US', 
            areaCode, 
            contains, 
            type = 'local',
            limit = 20 
        } = req.query;

        // Get the appropriate resource based on type
        let resource;
        switch (type) {
            case 'mobile':
                resource = twilioClient.availablePhoneNumbers(country).mobile;
                break;
            case 'tollFree':
                resource = twilioClient.availablePhoneNumbers(country).tollFree;
                break;
            case 'local':
            default:
                resource = twilioClient.availablePhoneNumbers(country).local;
                break;
        }

        // Search for available numbers
        const numbers = await resource.list({
            areaCode: areaCode || undefined,
            contains: contains || undefined,
            voiceEnabled: true,
            smsEnabled: true,
            limit: parseInt(limit)
        });

        // Format the results
        const results = numbers.map(number => ({
            phoneNumber: number.phoneNumber,
            friendlyName: number.friendlyName,
            locality: number.locality || 'Unknown',
            region: number.region || 'Unknown',
            isoCountry: number.isoCountry || country,
            capabilities: {
                voice: number.capabilities?.voice || false,
                sms: number.capabilities?.sms || false,
                mms: number.capabilities?.mms || false
            },
            monthlyRate: number.monthlyRate || '1.00'
        }));

        res.status(200).json({
            success: true,
            results: results,
            count: results.length,
            searchParams: {
                country,
                areaCode,
                contains,
                type,
                limit
            }
        });

    } catch (error) {
        
        // Handle specific Twilio errors
        if (error.code) {
            return next(new ErrorHandler(`Twilio error ${error.code}: ${error.message}`, 400));
        }
        
        return next(new ErrorHandler(`Failed to fetch available numbers: ${error.message}`, 500));
    }
});

// Function to transcribe call recordings
const transcribeCallRecording = async (callSid, recordingUrl) => {
    try {
        
        // Extract RecordingSid from the URL
        const recordingSid = recordingUrl.split('/').pop();
        
        // Download the recording using Twilio client with authentication
        const recording = await twilioClient.recordings(recordingSid).fetch();
           
        
        // Use Twilio's authenticated download method
        const recordingData = await twilioClient.recordings(recordingSid).fetch();
        
        // Get the authenticated URL for the audio file
        const authUrl = `https://api.twilio.com${recording.uri.replace('.json', '.wav')}`;
        
        // Create authenticated request using Twilio credentials
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');

        const response = await fetch(authUrl, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to download recording: ${response.statusText}`);
        }
        
        const audioData = await response.arrayBuffer();
        
        // Transcribe the audio
        const transcript = await transcribeFile(Buffer.from(audioData));
        
        if (transcript && transcript.trim()) {
            
            // Update the call record with the transcript
            await prisma.call.update({
                where: { call_sid: callSid },
                data: { transcript: transcript.trim() }
            });
            
        } else {
        }
        
    } catch (error) {
        throw error;
    }
};

