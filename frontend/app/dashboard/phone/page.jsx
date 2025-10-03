"use client"
import { useState, useEffect, useCallback, useRef } from "react";
import { Device } from "@twilio/voice-sdk";
import { createTwilioToken } from "@/lib/http/twilio";
import TwilioCallComponent from "@/components/TwilioCallComponent";
import { DialerPad } from "@/components/DialerPad";
import { BadgeHelp, Clock, CodeXml, FileJson, FileText, Import, Mail, MessageSquare, MoreVertical, PlusCircle, Rows4, Save, Table, UserPlus, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSubContent,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuSubTrigger,
    DropdownMenuSub
} from "@/components/ui/dropdown-menu";
import Papa from "papaparse";
import ContactList from "@/components/ContactList";
import { Input } from "@/components/ui/input";
import CallHistoryComponent from "@/components/CallHistoryComponent";
import CreateContactModal from "@/components/CreateContactModal";
import AvailablePhoneNumbers from "@/components/UserPhoneNumbers";
import CallDetailsModal from "@/components/CallDetailsModal";
import { TranscribedService } from "@/services/transcribeService";
import { createCall, getCallHistory, updateCallStatus, updateCallDescription } from "@/lib/http/callContactApi";
import { getContacts, createContact, bulkImportContacts } from "@/lib/http/callContactApi";
import { validatePhoneNumber, checkCallRateLimit, formatPhoneNumber } from "@/utils/phoneValidation";
import { toast } from "react-toastify";

export default function Phone() {
    const [device, setDevice] = useState(null);
    const [toNumber, setToNumber] = useState("");
    const [fromNumber, setFromNumber] = useState("");
    const [status, setStatus] = useState("");
    const [connection, setConnection] = useState(null);
    const [accepted, setAccepted] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [callInfo, setCallInfo] = useState({});
    const [callOpen, setCallOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [callTimer, setCallTimer] = useState(0);
    const [activeTab, setActiveTab] = useState("dialer")
    const [contact, setContact] = useState([]);
    const [history, setCallHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAudioContextResumed, setIsAudioContextResumed] = useState(false);
    const [tokenExpiry, setTokenExpiry] = useState(null);
    const [isInComingCall, setIsInComingCall] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [showCreateContact, setShowCreateContact] = useState(false);
    const [contactToCreate, setContactToCreate] = useState(null); // For pre-filling contact form
    const [isRefreshingToken, setIsRefreshingToken] = useState(false);
    const [showCallDetails, setShowCallDetails] = useState(false);
    const [selectedCall, setSelectedCall] = useState(null);
    const [transcribeService, setTranscribeService] = useState(null);
    const [callTranscript, setCallTranscript] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [currentCallSid, setCurrentCallSid] = useState(null);

    //incoming,processing,ringing
    const [controllView, setControllView] = useState(null);

    const timerRef = useRef(null);
    const deviceRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const transcribeServiceRef = useRef(null);


    const startTimer = () => {
        setCallTimer(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCallTimer((prevTime) => prevTime + 1);
        }, 1000);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };


    const stopTimer = () => {
        clearInterval(timerRef.current);
    };

    // Transcription service functions
    const startTranscription = (callSid) => {
        try {
            // Don't start transcription if already transcribing the same call
            if (isTranscribing && currentCallSid === callSid) {
                console.log('Already transcribing this call:', callSid);
                return;
            }

            // Clean up any existing transcription service first
            if (transcribeServiceRef.current) {
                console.log('Cleaning up existing transcription service...');
                transcribeServiceRef.current.disconnect();
                transcribeServiceRef.current = null;
            }

            console.log('Starting new transcription service for call:', callSid);
            const service = new TranscribedService({ 
                call_sid: callSid,
                user_id: 1 // You might want to get this from auth context
            });

            // Listen for transcription events
            service.io.on('transcript', (data) => {
                console.log('Received transcript:', data);
                setCallTranscript(prev => prev + ' ' + data.text);
            });

            transcribeServiceRef.current = service;
            setTranscribeService(service);
            setIsTranscribing(true);
            setCurrentCallSid(callSid);
            setCallTranscript('');
            
            console.log('Transcription service started successfully');
        } catch (error) {
            console.error('Failed to start transcription:', error);
            toast.error('Failed to start transcription');
            setIsTranscribing(false);
            setCurrentCallSid(null);
        }
    };

    const stopTranscription = () => {
        try {
            console.log('Stopping transcription service...');
            if (transcribeServiceRef.current) {
                transcribeServiceRef.current.disconnect();
                transcribeServiceRef.current = null;
            }
            setTranscribeService(null);
            setIsTranscribing(false);
            setCurrentCallSid(null);
            console.log('Transcription service stopped successfully');
        } catch (error) {
            console.error('Failed to stop transcription:', error);
            // Force cleanup even if there's an error
            transcribeServiceRef.current = null;
            setTranscribeService(null);
            setIsTranscribing(false);
            setCurrentCallSid(null);
        }
    };


    const initializeAudioContext = async () => {
        try {
            // Create and resume AudioContext to enable audio
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            setIsAudioContextResumed(true);
            console.log('AudioContext resumed successfully');
            return true;
        } catch (error) {
            console.error('Failed to resume AudioContext:', error);
            return false;
        }
    };

    const getToken = async (retryCount = 0) => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Check if AudioContext is available
            if (!isAudioContextResumed) {
                console.log('AudioContext not resumed, attempting to initialize...');
                const audioSuccess = await initializeAudioContext();
                if (!audioSuccess) {
                    throw new Error('AudioContext initialization failed');
                }
            }
            
            console.log('Requesting Twilio token...');
            const res = await createTwilioToken({});
            console.log('Token response:', res.data);
            
            const { token, from, expiresAt } = res.data;
            
            if (!token) {
                throw new Error('No token received from server');
            }
            
            // Only clean up existing device if we're not already registered
            if (deviceRef.current && deviceRef.current.state !== 'registered') {
                console.log('Cleaning up unregistered device');
                deviceRef.current.destroy();
            } else if (deviceRef.current && deviceRef.current.state === 'registered') {
                console.log('Device already registered, updating token only');
                // Update token without destroying the device
                deviceRef.current.updateToken(token);
                setIsReady(true);
                setIsLoading(false);
                setTokenExpiry(expiresAt);
                setFromNumber(from);
                return;
            }
            
            console.log('Initializing Twilio Device with token:', token.substring(0, 20) + '...');
            
            // Test token validity by decoding it
            try {
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    console.log('Token payload:', payload);
                    console.log('Token expires at:', new Date(payload.exp * 1000));
                    console.log('Token grants:', payload.grants);
                }
            } catch (decodeError) {
                console.warn('Could not decode token:', decodeError);
            }
            
            const twilioDevice = new Device(token, { 
                debug: true, // Enable debug to see what's happening
                region: "us1", 
                closeProtection: true 
            });

            // Log device state changes
            console.log('Device created, state:', twilioDevice.state);
            
            // Check if device is already ready
            if (twilioDevice.state === 'registered') {
                console.log('Device already registered, setting ready state');
                setIsReady(true);
                setIsLoading(false);
                setTokenExpiry(expiresAt);
                toast.success("Phone system ready!");
            }
            
            // Try to manually register if needed
            setTimeout(() => {
                console.log('Device state after 2 seconds:', twilioDevice.state);
                if (twilioDevice.state === 'unregistered') {
                    console.log('Attempting to register device...');
                    twilioDevice.register();
                } else if (twilioDevice.state === 'registered' && !isReady) {
                    console.log('Device registered after 2 seconds, setting ready state');
                    setIsReady(true);
                    setIsLoading(false);
                    setTokenExpiry(expiresAt);
                    toast.success("Phone system ready!");
                }
            }, 2000);

            // Add more debugging for registration process
            setTimeout(() => {
                console.log('Device state after 5 seconds:', twilioDevice.state);
                if (twilioDevice.state === 'unregistered') {
                    console.log('Device still unregistered after 5 seconds');
                    console.log('Device capabilities:', twilioDevice.capabilities);
                    console.log('Device edge:', twilioDevice.edge);
                } else if (twilioDevice.state === 'registered' && !isReady) {
                    console.log('Device is registered but UI not updated, fixing...');
                    setIsReady(true);
                    setIsLoading(false);
                    setTokenExpiry(expiresAt);
                    toast.success("Phone system ready!");
                }
            }, 5000);

            // Add comprehensive event logging
            twilioDevice.on("registered", () => {
                console.log("Device registered with Twilio");
                setIsReady(true);
                setIsLoading(false);
                setTokenExpiry(expiresAt);
                toast.success("Phone system ready!");
            });

            twilioDevice.on("unregistered", () => {
                console.log("Device unregistered from Twilio");
                setIsReady(false);
            });

            twilioDevice.on("tokenWillExpire", () => {
                console.log("Token will expire soon, refreshing...");
                if (!isRefreshingToken) {
                    setIsRefreshingToken(true);
                    getToken().finally(() => setIsRefreshingToken(false));
                }
            });

            twilioDevice.on("ready", () => {
                console.log("Twilio Device Ready");
                setIsReady(true);
                setIsLoading(false);
                setTokenExpiry(expiresAt);
                toast.success("Phone system ready!");
            });

            twilioDevice.on("error", (error) => {
                console.error("Device error:", error);
                console.error("Error code:", error.code);
                console.error("Error message:", error.message);
                console.error("Error details:", error);
                setIsReady(false);
                setIsLoading(false);
                setError(`Device error: ${error.message}`);
                toast.error(`Device error: ${error.message}`);
                
                // Retry after 5 seconds
                if (retryCount < 3) {
                    retryTimeoutRef.current = setTimeout(() => {
                        getToken(retryCount + 1);
                    }, 5000);
                }
            });

            // Handle call connection
            twilioDevice.on("connect", (conn) => {
                console.log("Call Connected");
                toast.success("Call connected!");
            });

            // Handle call disconnection
            twilioDevice.on("disconnect", () => {
                console.log("Call Disconnected");
                setConnection(null);
                setControllView(null);
                stopTimer();
                toast.info("Call ended");
            });

            deviceRef.current = twilioDevice;
            setDevice(twilioDevice);
            setFromNumber(from);

            // Add timeout to detect if device never becomes ready
            const deviceTimeout = setTimeout(() => {
                if (!isReady) {
                    console.error("Device initialization timeout - device never became ready");
                    setIsLoading(false);
                    setError("Device initialization timeout. Please try again.");
                    toast.error("Device initialization timeout. Please try again.");
                }
            }, 30000); // 30 second timeout

            // Clear timeout when device becomes ready or errors
            const clearDeviceTimeout = () => {
                clearTimeout(deviceTimeout);
            };
            
            twilioDevice.on("ready", clearDeviceTimeout);
            twilioDevice.on("registered", clearDeviceTimeout);
            twilioDevice.on("error", clearDeviceTimeout);

        } catch (error) {
            console.error("Token generation failed:", error);
            setIsLoading(false);
            setError(`Failed to initialize phone system: ${error.message}`);
            toast.error(`Failed to initialize phone system: ${error.message}`);
            
            // Retry after 10 seconds
            if (retryCount < 3) {
                retryTimeoutRef.current = setTimeout(() => {
                    getToken(retryCount + 1);
                }, 10000);
            }
        }
    }
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (deviceRef.current) {
                deviceRef.current.destroy();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (transcribeServiceRef.current) {
                transcribeServiceRef.current.disconnect();
            }
        };
    }, []);

    // Initialize token on mount
    useEffect(() => {
        getToken();
    }, []);

    // Handle user interaction to resume AudioContext
    const handleUserInteraction = async () => {
        if (!isAudioContextResumed) {
            const success = await initializeAudioContext();
            if (success) {
                // Re-initialize the device after AudioContext is resumed
                getToken();
            }
        }
    };

    // Load call history from API on mount
    useEffect(() => {
        loadCallHistory();
    }, []);

    const loadCallHistory = async () => {
        try {
            const response = await getCallHistory({ limit: 100 });
            if (response.data.success) {
                setCallHistory(response.data.data.calls);
            }
        } catch (error) {
            console.error('Failed to load call history:', error);
            toast.error('Failed to load call history');
        }
    };

    // Load contacts from API on mount
    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            const response = await getContacts({ limit: 100 });
            if (response.data.success) {
                setContact(response.data.data.contacts);
            }
        } catch (error) {
            console.error('Failed to load contacts:', error);
            toast.error('Failed to load contacts');
        }
    };

    // Check token expiry
    useEffect(() => {
        if (tokenExpiry) {
            const checkExpiry = () => {
                const timeUntilExpiry = tokenExpiry - Date.now();
                // Refresh token 5 minutes before expiry
                if (timeUntilExpiry <= 300000 && timeUntilExpiry > 0 && !isRefreshingToken) {
                    console.log("Token expiring soon, refreshing...");
                    toast.warning("Phone token expiring soon. Refreshing...");
                    setIsRefreshingToken(true);
                    getToken().finally(() => setIsRefreshingToken(false));
                } else if (timeUntilExpiry <= 0 && !isRefreshingToken) {
                    console.log("Token expired, refreshing...");
                    toast.warning("Phone token expired. Refreshing...");
                    setIsRefreshingToken(true);
                    getToken().finally(() => setIsRefreshingToken(false));
                }
            };
            
            const interval = setInterval(checkExpiry, 60000); // Check every minute
            return () => clearInterval(interval);
        }
    }, [tokenExpiry, isRefreshingToken]);

    const makeCall = async (name, number) => {
        // Validate device readiness
        if (!device || !isReady) {
            toast.error("Phone system not ready. Please wait and try again.");
            return;
        }

        // Validate phone number
        const validation = validatePhoneNumber(number);
        if (!validation.isValid) {
            toast.error(validation.error);
            return;
        }

        // Check rate limiting
        const rateLimitCheck = checkCallRateLimit('user', history);
        if (!rateLimitCheck.allowed) {
            toast.error(rateLimitCheck.error);
            return;
        }

        try {
            const formattedNumber = validation.formatted;
            
            console.log('Attempting to make call:');
            console.log('To:', formattedNumber);
            console.log('From:', fromNumber);
            console.log('Device state:', device.state);
            console.log('Device capabilities:', device.capabilities);
            console.log('Device edge:', device.edge);
            console.log('Device region:', device.region);
            console.log('Token expiry:', tokenExpiry);
            console.log('Current time:', Date.now());
            
        const connection = await device.connect({
                params: { To: formattedNumber, From: fromNumber }
        });

        // Log Call SID immediately after connection
        console.log('Call SID:', connection.parameters.CallSid);
        console.log('Call Parameters:', connection.parameters);
        
        // Check if Call SID is available
        if (!connection.parameters.CallSid) {
            console.warn('WARNING: Call SID is undefined - call may not be properly established');
            console.log('Connection state:', connection.status);
            console.log('Connection object:', connection);
            
            // Wait a bit and check again
            setTimeout(() => {
                console.log('Call SID after 2 seconds:', connection.parameters.CallSid);
                if (!connection.parameters.CallSid) {
                    console.error('CRITICAL: Call SID still undefined after 2 seconds - TwiML Application issue likely');
                    toast.error('Call setup failed - check TwiML Application configuration');
                }
            }, 2000);
        }

        setStatus("Ringing...");
        setConnection(connection);
            setCallInfo({ number: formattedNumber, name, callSid: connection.parameters.CallSid });
        setCallOpen(true);
        setControllView('ringing');

            // Note: Call records are created by Twilio webhooks, not here
            // This ensures we have proper CallSid and recording data

            // Add to local call history for immediate UI update
            const callRecord = {
                call_id: Date.now().toString(), // Temporary ID
                type: "outgoing",
                number: formattedNumber,
                name,
                timestamp: Date.now() + Math.random(), // Add random component to ensure uniqueness
                status: 'ringing',
                callSid: connection.parameters.CallSid // Store Call SID for debugging
            };
            setCallHistory(prev => [callRecord, ...prev]);

        connection.on("accept", () => {
            console.log('ACCEPT', connection.parameters.CallSid);
            setControllView('processing');
            setStatus("Connected");
            startTimer();
            toast.success("Call connected!");
            
            // Start transcription when call is accepted
            if (connection.parameters.CallSid) {
                startTranscription(connection.parameters.CallSid);
            }
            
            // Update call history
            setCallHistory(prev => 
                prev.map(call => 
                    call.timestamp === callRecord.timestamp 
                        ? { ...call, status: 'connected' }
                        : call
                )
            );
        });

        connection.on("disconnect", () => {
            console.log('DISCONNECT', connection.parameters.CallSid);
            console.log("Call disconnected event received");
            setStatus("Call Ended");
            setIsDisconnecting(false);
            
            // Save transcript before stopping transcription
            if (callTranscript && connection.parameters.CallSid) {
                saveCallTranscript(connection.parameters.CallSid, callTranscript);
            }
            
            // Stop transcription when call ends
            stopTranscription();
            
            setTimeout(() => {
                setIsInComingCall(false);
                setCallOpen(false);
                setConnection(null);
                setCallInfo({});
                setControllView(null);
                setCallTranscript('');
            }, 600);
            stopTimer();
            toast.info("Call ended");
            
            // Update call history
            setCallHistory(prev => 
                prev.map(call => 
                    call.timestamp === callRecord.timestamp 
                        ? { ...call, status: 'ended', duration: callTimer, transcript: callTranscript }
                        : call
                )
            );
        });
            
            connection.on("error", (err) => {
                console.error('VOICE ERROR', err?.code, err?.message, 'SID:', connection.parameters.CallSid);
                console.error("Call connection error:", err);
                console.error("Error code:", err.code);
                console.error("Error message:", err.message);
                console.error("Error details:", err);
                
                setStatus(`Error: ${err.message}`);
                toast.error(`Call error: ${err.message}`);
                
                // Update call history
                setCallHistory(prev => 
                    prev.map(call => 
                        call.timestamp === callRecord.timestamp 
                            ? { ...call, status: 'error', error: err.message, callSid: connection.parameters.CallSid }
                            : call
                    )
                );
            });
            
        } catch (error) {
            console.error("Call initiation failed:", error);
            console.error("Error details:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            toast.error(`Failed to make call: ${error.message}`);
            
            // Add to call history as failed attempt
            const failedCallRecord = {
                type: "outgoing",
                number: formattedNumber,
                name,
                timestamp: Date.now() + Math.random(),
                status: 'failed',
                error: error.message,
                callSid: 'N/A - Connection failed'
            };
            setCallHistory(prev => [failedCallRecord, ...prev]);
        }
    };



    const toggleMute = useCallback(() => {
        if (connection) {
            try {
                const newMuteState = !isMuted;
                connection.mute(newMuteState);
                setIsMuted(newMuteState);
                console.log(newMuteState ? "Muted" : "Unmuted");
                toast.info(newMuteState ? "Microphone muted" : "Microphone unmuted");
            } catch (error) {
                console.error("Failed to toggle mute:", error);
                toast.error(`Failed to toggle mute: ${error.message}`);
            }
        }
    }, [connection, isMuted]);

    const hangupCall = useCallback(() => {
        if (connection && !isDisconnecting) {
            try {
                console.log("Manually hanging up call...");
                console.log("Hangup Call SID:", connection.parameters.CallSid);
                setIsDisconnecting(true);
                connection.disconnect();
                // Don't immediately clear state - let the disconnect event handler do it
                toast.info("Ending call...");
            } catch (error) {
                console.error("Failed to hangup call:", error);
                console.error("Error details:", error);
                console.error("Hangup Call SID:", connection.parameters.CallSid);
                toast.error(`Failed to end call: ${error.message}`);
                // Force cleanup if disconnect fails
                setIsDisconnecting(false);
                setCallOpen(false);
                setConnection(null);
                setCallInfo({});
                setControllView(null);
                stopTimer();
            }
        }
    }, [connection, isDisconnecting]);



    //upload contact
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = async ({ target }) => {
            Papa.parse(target.result, {
                header: true, // Convert CSV to JSON
                skipEmptyLines: true,
                complete: async (result) => {
                    try {
                        // Transform CSV data to match API format
                        const contacts = result.data.map(row => ({
                            name: row.name || row.Name || '',
                            phone_number: row.number || row.phone || row.phone_number || '',
                            email: row.email || row.Email || null,
                            company: row.company || row.Company || null,
                            notes: row.notes || row.Notes || null
                        }));

                        // Import contacts via API
                        const response = await bulkImportContacts(contacts);
                        if (response.data.success) {
                            toast.success(`Successfully imported ${response.data.data.imported_count} contacts`);
                            // Reload contacts from API
                            await loadContacts();
                            setActiveTab("contact");
                        } else {
                            toast.error('Failed to import contacts');
                        }
                    } catch (error) {
                        console.error('Failed to import contacts:', error);
                        toast.error('Failed to import contacts');
                    }
                },
            });
        };

        reader.readAsText(file);
    }

    const handleContactCreated = async (newContact) => {
        // Reload contacts from API to include the new contact
        await loadContacts();
        toast.success('Contact added successfully!');
    };

    const handleViewCallDetails = (call) => {
        setSelectedCall(call);
        setShowCallDetails(true);
    };

    const handleCallUpdate = (updatedCall) => {
        // Update the call in the local history
        setCallHistory(prev => 
            prev.map(call => 
                call.call_id === updatedCall.call_id || call.timestamp === updatedCall.timestamp
                    ? { ...call, ...updatedCall }
                    : call
            )
        );
    };

    const saveCallTranscript = async (callSid, transcript) => {
        try {
            if (!callSid || !transcript) return;
            
            // Find the call record to update
            const callRecord = history.find(call => call.callSid === callSid);
            if (!callRecord) return;

            // Update call record with transcript
            const updateData = { transcript };
            const response = await updateCallStatus(callRecord.call_id, updateData);
            
            if (response.data.success) {
                console.log('Call transcript saved successfully');
                // Update local history
                setCallHistory(prev => 
                    prev.map(call => 
                        call.callSid === callSid 
                            ? { ...call, transcript }
                            : call
                    )
                );
            }
        } catch (error) {
            console.error('Failed to save call transcript:', error);
        }
    };

    const MoreOption = () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className='hover:bg-transparent'>

                <MoreVertical size={20} />

            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-2 mt-2">
                <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setShowCreateContact(true)}>
                        <Save />
                        <span className='text-black/70'>New Contact</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                        <Clock />
                        <span className='text-black/70'>Call History</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                        <BadgeHelp />
                        <span className='text-black/70'>Help And Feedback</span>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Import />
                            <span>Import Contact</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <label htmlFor="contactFile">

                                    <DropdownMenuItem>

                                        <Table />
                                        <span>Import As CSV</span>
                                    </DropdownMenuItem>
                                </label>
                                <DropdownMenuItem >
                                    <Rows4 />
                                    <span>Import As Excel</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem >
                                    <FileJson />
                                    <span>Import As JSON</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem >
                                    <CodeXml />
                                    <span>Import As XML</span>
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
    return (
        <>

            <input type="file" id="contactFile" hidden onChange={handleFileUpload} accept=".csv" />
            <div className="flex h-screen flex-col bg-white m-2 rounded-md overflow-y-auto relative" onClick={handleUserInteraction}>
                {/* Status Header */}
                <div className="bg-gray-50 border-b border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-semibold text-gray-900">Phone System</h1>
                            <div className="flex items-center gap-2">
                                {isLoading && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span className="text-sm">Initializing...</span>
                                    </div>
                                )}
                                {isReady && !isLoading && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                        <span className="text-sm">Ready</span>
                                    </div>
                                )}
                                {error && !isLoading && (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm">Error</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">From: {formatPhoneNumber(fromNumber)}</span>
                        </div>
                    </div>
                    
                    {/* Error Display */}
                    {error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-red-800">{error}</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => getToken()}
                                >
                                    Retry Connection
                                </Button>
                                {!isAudioContextResumed && (
                                    <Button 
                                        variant="default" 
                                        size="sm" 
                                        onClick={handleUserInteraction}
                                    >
                                        Enable Audio
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* AudioContext Warning */}
                    {!isAudioContextResumed && !error && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm text-yellow-800">
                                    Audio permissions required. Click "Enable Audio" to start calling.
                                </span>
                            </div>
                            <Button 
                                variant="default" 
                                size="sm" 
                                className="mt-2"
                                onClick={handleUserInteraction}
                            >
                                Enable Audio
                            </Button>
                        </div>
                    )}
                </div>
                <div className="bg-gray-200 rounded-md shadow-inner  m-2 flex items-center p-[1px]">
                    <Button variant="ghost" className={`flex-1 ${activeTab == "dialer" ? "bg-white" : ""}`} onClick={() => setActiveTab("dialer")}>
                        Dialer
                    </Button>
                    <Button variant="ghost" className={`flex-1  ${activeTab == "contact" ? "bg-white" : ""}`} onClick={() => setActiveTab("contact")}>
                        Contact
                    </Button>
                    <Button variant="ghost" className={`flex-1  ${activeTab == "history" ? "bg-white" : ""}`} onClick={() => setActiveTab("history")}>
                        History
                    </Button>
                    <Button variant="ghost" className={`flex-1  ${activeTab == "numbers" ? "bg-white" : ""}`} onClick={() => setActiveTab("numbers")}>
                        Browse Numbers
                    </Button>
                </div>


                {
                    activeTab == "dialer" &&
                    <div className="flex flex-col gap-4 p-6 h-full relative">
                        <div className="flex items-center justify-between">
                            <Button 
                                onClick={() => {
                                    setContactToCreate({ phone_number: toNumber });
                                    setShowCreateContact(true);
                                }}
                                variant="outline"
                                className="text-sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Save as Contact
                            </Button>
                            <MoreOption />
                        </div>
                        <div className="flex flex-col h-full">
                            {
                                history.length == 0 &&
                                <div className="flex-1 flex items-center justify-center">
                                    <h1 className="text-2xl">No Call History</h1>
                                </div>
                            }

                            {
                                history.length != 0 &&
                                <div className="flex-1 overflow-y-auto">
                                    <CallHistoryComponent 
                                        history={history} 
                                        makeCall={makeCall}
                                        contacts={contact}
                                        onSaveAsContact={(phoneNumber) => {
                                            setContactToCreate({ phone_number: phoneNumber });
                                            setShowCreateContact(true);
                                        }}
                                        onViewDetails={handleViewCallDetails}
                                    />
                                </div>
                            }
                            <div onClick={handleUserInteraction}>
                            <DialerPad phoneNumber={toNumber} setPhoneNumber={setToNumber} handleCall={() => makeCall(undefined,toNumber)} />
                            </div>
                        </div>
                    </div>
                }



                {
                    activeTab == "contact" &&
                    <div className='mx-2 my-4 px-5'>
                        <div className="flex items-center gap-4 mb-4">
                            <Input className='py-2 w-full px-2 ring-0 outline-none bg-gray-50 shadow-sm rounded-3xl focus:ring-0 flex-1' placeholder='Search Contact' />
                            <Button 
                                onClick={() => setShowCreateContact(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Contact
                            </Button>
                            <MoreOption />
                        </div>

                        <ContactList contact={contact} makeCall={makeCall} setToNumber={setToNumber} setCallInfo={setCallInfo} />
                    </div>
                }

                {
                    activeTab == "history" &&
                    <div className='mx-2 my-4 px-5'>
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-lg font-semibold">Call History</h2>
                            <div className="flex-1" />
                            <Button 
                                onClick={() => loadCallHistory()}
                                variant="outline"
                                size="sm"
                            >
                                Refresh
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {history.length === 0 ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Call History</h3>
                                        <p className="text-gray-500">Your call history will appear here after making calls.</p>
                                    </div>
                                </div>
                            ) : (
                                <CallHistoryComponent 
                                    history={history} 
                                    makeCall={makeCall}
                                    contacts={contact}
                                    onSaveAsContact={(phoneNumber) => {
                                        setContactToCreate({ phone_number: phoneNumber });
                                        setShowCreateContact(true);
                                    }}
                                    onViewDetails={handleViewCallDetails}
                                />
                            )}
                        </div>
                    </div>
                }

                {
                    activeTab == "numbers" &&
                    <div className='mx-2 my-4 px-5'>
                        <AvailablePhoneNumbers />
                    </div>
                }
            </div>
            {
                callOpen &&
                <TwilioCallComponent 
                    accepted={accepted} 
                    timer={formatTime(callTimer)} 
                    controllView={controllView} 
                    status={status} 
                    callInfo={callInfo} 
                    isIncoming={false} 
                    hangupCall={hangupCall} 
                    toggleMute={toggleMute} 
                    isMuted={isMuted}
                    transcript={callTranscript}
                    isTranscribing={isTranscribing}
                    onToggleTranscription={() => {
                        if (transcribeServiceRef.current) {
                            transcribeServiceRef.current.handlemute(!isTranscribing);
                        }
                    }}
                    isTranscriptionEnabled={isTranscribing}
                />
            }
            
            {/* Create Contact Modal */}
            <CreateContactModal 
                isOpen={showCreateContact}
                onClose={() => {
                    setShowCreateContact(false);
                    setContactToCreate(null);
                }}
                onContactCreated={handleContactCreated}
                prefillData={contactToCreate}
            />

            {/* Call Details Modal */}
            <CallDetailsModal 
                isOpen={showCallDetails}
                onClose={() => {
                    setShowCallDetails(false);
                    setSelectedCall(null);
                }}
                call={selectedCall}
                onUpdate={handleCallUpdate}
            />
        </>

    );
}
