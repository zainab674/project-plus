import catchAsyncError from '../middlewares/catchAsyncError.js';
import { prisma } from "../prisma/index.js";
import { uploadToCloud } from '../services/mediaService.js';
import { sendDocumentRequest, sendSignatureRequest } from '../services/meetingService.js';
import ErrorHandler from '../utils/errorHandler.js';
import dayjs from 'dayjs';

export const requestDocument = catchAsyncError(async (req, res, next) => {
    let { project_client_id, name, description } = req.body;

    if (!project_client_id || !name || !description) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const project_client = await prisma.projectClient.findFirst({
        where: {
            project_client_id
        },
        include: {
            user: true
        }
    });

    if (!project_client) {
        return next(new ErrorHandler("Invalid project client id", 400));
    }

    const document = await prisma.documents.create({
        data: {
            project_client_id: project_client_id,
            name,
            description,
            status: "PENDING",
            project_id: project_client.project_id,
            user_id: project_client.user_id
        }
    });

    sendDocumentRequest(project_client, name, description, project_client.user.email);

    // Also create email record in database for mail center
    await prisma.email.create({
        data: {
            user_id: req.user.user_id, // The provider/lawyer who requested the document
            to_user: project_client.user_id, // The client who needs to submit
            subject: `Document Request - ${name}`,
            content: `Please submit the requested document: ${description}.`,
            project_id: project_client.project_id,
            created_at: new Date()
        }
    });

    res.status(200).json({
        success: true,
        document
    });
});



export const updateDocument = catchAsyncError(async (req, res, next) => {
    let { document_id } = req.body;

    const file = req.file;
    if (!file) {
        next(new ErrorHandler('File is required', 401));
        return
    }

    if (!document_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const cloudRes = await uploadToCloud(file);

    const document = await prisma.documents.update({
        where: {
            document_id
        },
        data: {
            file_url: cloudRes.url,
            key: cloudRes.key,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.buffer.length
        }
    });



    res.status(200).json({
        success: true,
        document
    });
});


export const updateStatus = catchAsyncError(async (req, res, next) => {
    let { document_id, status } = req.body;



    if (!document_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }



    const document = await prisma.documents.update({
        where: {
            document_id
        },
        data: {
            status
        }
    });



    res.status(200).json({
        success: true,
        document
    });
});



export const getAllDocuments = catchAsyncError(async (req, res, next) => {
    let { project_client_id } = req.params;


    if (!project_client_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const documents = await prisma.documents.findMany({
        where: {
            project_client_id
        }
    });

    res.status(200).json({
        success: true,
        documents
    });
});



export const giveUpdates = catchAsyncError(async (req, res, next) => {
    let { project_client_id, message } = req.body;

    if (!project_client_id || !message) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const project_client = await prisma.projectClient.findFirst({
        where: {
            project_client_id
        }
    });

    if (!project_client) {
        return next(new ErrorHandler("Invalid project client id", 400));
    }

    const data = {
        project_client_id: project_client_id,
        message,
        project_id: project_client.project_id,
        user_id: project_client.user_id,

    }


    const file = req.file;
    let cloudRes;
    if (file) {
        cloudRes = await uploadToCloud(file);
        data.file_url = cloudRes.url;
        data.mimeType = file.mimetype;
        data.size = file.buffer.length;
        data.filename = file.originalname;
    }


    const document = await prisma.updates.create({
        data: data
    });

    res.status(200).json({
        success: true,
        document
    });
})

export const getUpdates = catchAsyncError(async (req, res, next) => {
    let { project_client_id } = req.params;

    if (!project_client_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const project_client = await prisma.projectClient.findFirst({
        where: {
            project_client_id
        }
    });

    if (!project_client) {
        return next(new ErrorHandler("Invalid project client id", 400));
    }


    const updates = await prisma.updates.findMany({
        where: {
            project_client_id
        }
    });

    res.status(200).json({
        success: true,
        updates
    });
})


export const getOverview = catchAsyncError(async (req, res, next) => {
    let { date, project_id, user_id } = req.query;

    // Parse the date correctly
    date = date ? dayjs(date, "DD-MM-YYYY", true) : dayjs(); // Ensure strict parsing
    if (!date.isValid()) {
        return res.status(400).json({ success: false, message: "Invalid date format" });
    }

    const formattedDate = date.format("YYYY-MM-DD");
    try {

        // Fetch counts
        const updates = await prisma.updates.findMany({
            where: {
                project_id: parseInt(project_id),
                user_id: parseInt(user_id),
                created_at: {
                    gte: new Date(`${formattedDate}T00:00:00Z`),
                    lt: new Date(`${formattedDate}T23:59:59Z`),
                },
            },
        });

        const documents = await prisma.documents.findMany({ // Use the correct model name
            where: {
                project_id: parseInt(project_id),
                user_id: parseInt(user_id),
                created_at: {
                    gte: new Date(`${formattedDate}T00:00:00Z`),
                    lt: new Date(`${formattedDate}T23:59:59Z`),
                },
            },
        });


        //fetch messages and calls
        const conversations = await prisma.conversation.findMany({
            where: {
                project_id: Number(project_id),  // Safer conversion
                participants: {
                    some: {
                        user_id: parseInt(user_id),
                    },
                },
            },
            select: {
                conversation_id: true
            }
        });


        const conversationIds = conversations.map(convo => convo.conversation_id);

        const messages = await prisma.message.findMany({
            where: {
                conversation_id: {
                    in: conversationIds,
                },
                createdAt: {
                    gte: new Date(`${formattedDate}T00:00:00Z`),
                    lt: new Date(`${formattedDate}T23:59:59Z`),
                }
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        const calls = messages.filter(message => message.content_type == "CALL");
        const chats = messages.filter(message => message.content_type != "CALL");
        const totalCallDuration = calls.reduce((total, call) => {
            let duration = call.duration?.trim() || "0s";
            let seconds = 0;

            const minutesMatch = duration.match(/^(\d+)\s*min/);
            const secondsMatch = duration.match(/^(\d+)\s*s/);

            if (minutesMatch) {
                seconds += parseInt(minutesMatch[1]) * 60;
            } else if (secondsMatch) {
                seconds += parseInt(secondsMatch[1]);
            }

            return total + seconds;
        }, 0);


        //meetings
        const meetings = await prisma.meeting.findMany({
            where: {
                project_id: parseInt(project_id),
                created_at: {
                    gte: new Date(`${formattedDate}T00:00:00Z`),
                    lt: new Date(`${formattedDate}T23:59:59Z`),
                },
                OR: [
                    { user_id: parseInt(user_id) },
                    { participants: { some: { user_id: parseInt(user_id) } } }
                ]
            }
        })


        //mails
        const mails = await prisma.email.findMany({
            where: {
                project_id: parseInt(project_id),
                created_at: {
                    gte: new Date(`${formattedDate}T00:00:00Z`),
                    lt: new Date(`${formattedDate}T23:59:59Z`),
                },
                to_user: parseInt(user_id)
            }
        })


        res.status(200).json({
            success: true,
            date: formattedDate,
            overview: { updates, documents, chats, calls, meetings, mails, callDurations: totalCallDuration },
        });

    } catch (error) {
        next(error); // Pass errors to the error handler
    }
});




export const getInDateRange = catchAsyncError(async (req, res, next) => {
    const { project_client_id } = req.params;
    let { startDate, endDate } = req.query;


    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: "Start and end dates are required" });
    }


    const start = dayjs(startDate, "DD-MM-YYYY", true);
    const end = dayjs(endDate, "DD-MM-YYYY", true);

    if (!start.isValid() || !end.isValid()) {
        return res.status(400).json({ success: false, message: "Invalid date format" });
    }

    // Convert to YYYY-MM-DD format
    const formattedStart = start.format("YYYY-MM-DD");
    const formattedEnd = end.format("YYYY-MM-DD");


    try {
        const projectClient = await prisma.projectClient.findUnique({
            where: {
                project_client_id
            }
        })
        const project_id = projectClient.project_id;

        // Fetch updates within date range
        const updates = await prisma.updates.findMany({
            where: {
                project_id: parseInt(project_id),
                user_id: projectClient.user_id,
                created_at: {
                    gte: new Date(`${formattedStart}T00:00:00Z`),
                    lt: new Date(`${formattedEnd}T23:59:59Z`),
                },
            },
        });

        // Fetch documents within date range
        const documents = await prisma.documents.findMany({
            where: {
                project_id: parseInt(project_id),
                user_id: projectClient.user_id,
                created_at: {
                    gte: new Date(`${formattedStart}T00:00:00Z`),
                    lt: new Date(`${formattedEnd}T23:59:59Z`),
                },
            },
        });


        //fetch messages and calls
        const conversations = await prisma.conversation.findMany({
            where: {
                project_id: Number(project_id),  // Safer conversion
                participants: {
                    some: {
                        user_id: projectClient.user_id,
                    },
                },
            },
            select: {
                conversation_id: true
            }
        });

        const conversationIds = conversations.map(convo => convo.conversation_id);

        const messages = await prisma.message.findMany({
            where: {
                conversation_id: {
                    in: conversationIds,
                },
                createdAt: {
                    gte: new Date(`${formattedStart}T00:00:00Z`),
                    lt: new Date(`${formattedEnd}T23:59:59Z`),
                }
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        const calls = messages.filter(message => message.content_type == "CALL");
        const chats = messages.filter(message => message.content_type != "CALL");
        const totalCallDuration = calls.reduce((total, call) => {
            let duration = call.duration?.trim() || "0s";
            let seconds = 0;

            const minutesMatch = duration.match(/^(\d+)\s*min/);
            const secondsMatch = duration.match(/^(\d+)\s*s/);

            if (minutesMatch) {
                seconds += parseInt(minutesMatch[1]) * 60;
            } else if (secondsMatch) {
                seconds += parseInt(secondsMatch[1]);
            }

            return total + seconds;
        }, 0);


        //meetings
        const meetings = await prisma.meeting.findMany({
            where: {
                project_id: parseInt(project_id),
                created_at: {
                    gte: new Date(`${formattedStart}T00:00:00Z`),
                    lt: new Date(`${formattedEnd}T23:59:59Z`),
                },
                OR: [
                    { user_id: projectClient.user_id },
                    { participants: { some: { user_id: projectClient.user_id } } }
                ]
            }
        })


        //mails
        const mails = await prisma.email.findMany({
            where: {
                project_id: parseInt(project_id),
                created_at: {
                    gte: new Date(`${formattedStart}T00:00:00Z`),
                    lt: new Date(`${formattedEnd}T23:59:59Z`),
                },
                to_user: projectClient.user_id
            }
        })



        const taskTimes = await prisma.taskTime.findMany({
            where: {
                project_id: parseInt(project_id),
                created_at: {
                    gte: new Date(`${formattedStart}T00:00:00Z`),
                    lt: new Date(`${formattedEnd}T23:59:59Z`),
                },
            },
            select: {
                start: true,
                end: true,
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });


        const userTimeMap = {};
        let grandTotalMs = 0;
      
        for (const time of taskTimes) {
            const { start, end, user } = time;
            const durationMs = new Date(end).getTime() - new Date(start).getTime();
            grandTotalMs += durationMs;
            const key = user.email; // unique key per user
            if (!userTimeMap[key]) {
                userTimeMap[key] = {
                    name: user.name,
                    email: user.email,
                    totalMs: 0
                };
            }

            userTimeMap[key].totalMs += durationMs;
        }

        const workingHours = Object.values(userTimeMap).map(user => {
            const totalMinutes = Math.floor(user.totalMs / 1000 / 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return [user.name, user.email, `${hours}h ${minutes}m`];
        });

        // Add grand total at the end
        const totalMinutes = Math.floor(grandTotalMs / 1000 / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalRemainingMinutes = totalMinutes % 60;
        const totalTimeStr = `${totalHours}h ${totalRemainingMinutes}m`;



        res.status(200).json({
            success: true,
            startDate: formattedStart,
            endDate: formattedEnd,
            info: { updates, documents, calls, chats, meetings, mails, callDurations: totalCallDuration,totalTimeStr,workingHours },
            
        });

    } catch (error) {
        next(error);
    }
});






//billing statrt
export const createBill = catchAsyncError(async (req, res, next) => {
    let { project_client_id, start_date, end_date, amount, description } = req.body;

    if (!project_client_id || !start_date || !end_date || !amount || !description) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const project_client = await prisma.projectClient.findFirst({
        where: {
            project_client_id
        }
    });

    if (!project_client) {
        return next(new ErrorHandler("Invalid project client id", 400));
    }

    const document = await prisma.billing.create({
        data: {
            project_client_id: project_client_id,
            description,
            status: "UNPAID",
            project_id: project_client.project_id,
            user_id: project_client.user_id,
            amount,
            end_date,
            start_date,
        }
    });

    res.status(200).json({
        success: true,
        document
    });
});




export const updateBillingStatus = catchAsyncError(async (req, res, next) => {
    let { billing_id, status } = req.body;



    if (!billing_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }



    const billing = await prisma.billing.update({
        where: {
            billing_id
        },
        data: {
            status
        }
    });



    res.status(200).json({
        success: true,
        billing
    });
});



export const getAllBilling = catchAsyncError(async (req, res, next) => {
    let { project_client_id } = req.params;


    if (!project_client_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const billings = await prisma.billing.findMany({
        where: {
            project_client_id
        }
    });

    res.status(200).json({
        success: true,
        billings
    });
});




//filed statrt
export const createFiled = catchAsyncError(async (req, res, next) => {
    let { project_client_id, description, name, progress, date, project_id } = req.body;


    if (!project_client_id || !name || !progress || !date || !description) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const client = await prisma.projectClient.findFirst({
        where: {
            project_client_id
        }
    });

    const file = req.file;

    const data = {};
    if (file) {
        const cloudRes = await uploadToCloud(file);
        data.file_url = cloudRes.url;
        data.key = cloudRes.key;
        data.filename = file.originalname;
        data.mimeType = file.mimetype;
        data.size = file.buffer.length;
    }

    const filed = await prisma.filled.create({
        data: {
            project_client_id,
            description,
            name,
            progress,
            date: `${date}T00:00:00Z`,
            project_id: client.project_id,
            user_id: client.user_id,
            status: "PENDING",

            ...data
        }
    });


    res.status(200).json({
        success: true,
        filed
    });
});




export const updateFiledStatus = catchAsyncError(async (req, res, next) => {
    let { filled_id, status } = req.body;



    if (!filled_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const filled = await prisma.filled.update({
        where: {
            filled_id
        },
        data: {
            status
        }
    });



    res.status(200).json({
        success: true,
        filled
    });
});



export const getAllFiled = catchAsyncError(async (req, res, next) => {
    let { project_client_id } = req.params;


    if (!project_client_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const filed = await prisma.filled.findMany({
        where: {
            project_client_id
        }
    });

    res.status(200).json({
        success: true,
        filed
    });
});



//get pending documents
export const getPendingDocs = catchAsyncError(async (req, res, next) => {
    const user_id = req.user.user_id;
    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { created_by: user_id },
                { Members: { some: { user_id } } },
                { Clients: { some: { user_id } } }
            ]
        },
        select: {
            project_id: true,
            name: true
        }
    });



    const pendingData = [];

    for (let i = 0; i < projects.length; i++) {
        const project = projects[i];

        const pendingDocs = await prisma.documents.findMany({
            where: {
                project_id: project.project_id,
                status: {
                    in: ["PENDING", "REJECTED"]
                }
            },
            select: {
                name: true,
                description: true,
                document_id: true,
                status: true,
                project_client_id: true,
                projectClient: {
                    select: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                user_id: true
                            }
                        }
                    }
                }
            }
        });


        if (pendingDocs.length == 0) continue;
        pendingData.push({
            ...project,
            pendingDocs
        });
    }

    res.status(200).json(pendingData)
})




export const getPendingsDocsByProjectId = catchAsyncError(async (req, res, next) => {
    const { project_id } = req.params;

    const pendingDocs = await prisma.documents.findMany({
        where: {
            project_id: parseInt(project_id),
            status: {
                in: ["PENDING", "REJECTED"]
            }
        }
    });
    res.status(200).json(pendingDocs)
})


//signature
export const createSign = catchAsyncError(async (req, res, next) => {
    let { project_client_id, name, description } = req.body;
    const file = req.file;
    if (!project_client_id || !name || !description || !file) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const project_client = await prisma.projectClient.findFirst({
        where: {
            project_client_id
        },
        include: {
            user: true
        }
    });

    if (!project_client) {
        return next(new ErrorHandler("Invalid project client id", 400));
    }

    const cloudRes = await uploadToCloud(file);

    const document = await prisma.signed.create({
        data: {
            project_client_id: project_client_id,
            name,
            description,
            project_id: project_client.project_id,
            user_id: project_client.user_id,
            file_url: cloudRes.url,
            key: cloudRes.key,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.buffer.length
        }
    });

    sendSignatureRequest(project_client, name, description, project_client.user.email);

    // Also create email record in database for mail center
    await prisma.email.create({
        data: {
            user_id: req.user.user_id, // The provider/lawyer who requested the signature
            to_user: project_client.user_id, // The client who needs to sign
            subject: `Submit Document - ${name}`,
            content: `Please review and sign the document: ${description}. Click the link below to access the document.`,
            project_id: project_client.project_id,
            created_at: new Date()
        }
    });

    res.status(200).json({
        success: true,
        document
    });
});



export const uploadSign = catchAsyncError(async (req, res, next) => {
    let { signed_id } = req.body;

    const file = req.file;
    if (!file) {
        next(new ErrorHandler('File is required', 401));
        return
    }

    if (!signed_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const cloudRes = await uploadToCloud(file);

    const document = await prisma.signed.update({
        where: {
            signed_id
        },
        data: {
            sign_file_url: cloudRes.url,
            sign_size: file.buffer.length,
            sign_mimeType: file.mimetype,
            sign_filename: file.originalname,
            sign_key: cloudRes.key,
            sign_date: new Date()
        }
    });



    res.status(200).json({
        success: true,
        document
    });
});



export const updateSignStatus = catchAsyncError(async (req, res, next) => {
    let { signed_id, status } = req.body;


    if (!signed_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const signed = await prisma.signed.update({
        where: {
            signed_id
        },
        data: {
            status
        }
    });



    res.status(200).json({
        success: true,
        signed
    });
});


export const getAllSign = catchAsyncError(async (req, res, next) => {
    let { project_client_id } = req.params;


    if (!project_client_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const signed = await prisma.signed.findMany({
        where: {
            project_client_id
        }
    });

    res.status(200).json({
        success: true,
        signed
    });
});




export const getClientHistory = catchAsyncError(async (req, res, next) => {
    let { project_client_id } = req.params;


    if (!project_client_id) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const signed = await prisma.signed.findMany({
        where: {
            project_client_id
        }
    });

    const documents = await prisma.documents.findMany({
        where: {
            project_client_id
        }
    });

    const updates = await prisma.updates.findMany({
        where: {
            project_client_id
        }
    });

    const billings = await prisma.billing.findMany({
        where: {
            project_client_id
        }
    });

    const filed = await prisma.filled.findMany({
        where: {
            project_client_id
        }
    });


    res.status(200).json({
        success: true,
        signed,
        documents,
        updates,
        billings,
        filed
    });
});


export const getAllClientDocuments = catchAsyncError(async (req, res, next) => {
    let { project_client_id } = req.params;

    // Documents
    const documentsRaw = await prisma.documents.findMany({
        where: {
            projectClient: {
                user_id: parseInt(project_client_id)
            }
        }
    });

    const documents = documentsRaw.map(doc => ({
        name: doc.filename,
        file_url: doc.file_url,
        size: doc.size,
        mimeType: doc.mimeType
    }));

    // Filed
    const filedRaw = await prisma.filled.findMany({
        where: {
            projectClient: {
                user_id: parseInt(project_client_id)
            }
        }
    });
    const filed = filedRaw.map(f => ({
        name: f.filename,
        file_url: f.file_url,
        size: f.size,
        mimeType: f.mimeType
    }));

    // Signed
    const signedRaw = await prisma.signed.findMany({
        where: {
            projectClient: {
                user_id: parseInt(project_client_id)
            }
        }
    });
    const signed = signedRaw.map(s => ({
        name:  s.filename ,
        file_url: s.file_url,
        size: s.size,
        mimeType: s.mimeType
    }));

    // tdocument (File)
    const tdocumentRaw = await prisma.file.findMany({
        where: {
            client_id: parseInt(project_client_id)
        }
    });
    const tdocument = tdocumentRaw.map(t => ({
        name: t.name,
        file_url: t.path || null,
        size: t.size || null,
        mimeType: t.type || null
    }));

    res.status(200).json({
        success: true,
        data: [
            ...documents,
            ...filed,
            ...signed,
            ...tdocument
        ]
    });
});

export const getClientProjects = catchAsyncError(async (req, res, next) => {
    const user_id = req.user.user_id;

    // Get all projects where the user is a client
    const clientProjects = await prisma.projectClient.findMany({
        where: {
            user_id: user_id
        },
        include: {
            project: {
                select: {
                    project_id: true,
                    name: true,
                    description: true,
                    created_at: true,
                    updated_at: true,
                    status: true,
                    priority: true,
                    client_name: true,
                    client_address: true,
                    budget: true,
                    filingDate: true,
                    phases: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            user_id: true
                        }
                    }
                }
            },
            Documents: {
                where: {
                    status: {
                        in: ["PENDING", "REJECTED"]
                    }
                },
                select: {
                    document_id: true,
                    name: true,
                    description: true,
                    status: true,
                    created_at: true
                }
            },
            Filled: {
                where: {
                    status: {
                        in: ["PENDING", "PROCESSING"]
                    }
                },
                select: {
                    filled_id: true,
                    name: true,
                    description: true,
                    status: true,
                    created_at: true
                }
            },
            signed: {
                where: {
                    status: "PENDING"
                },
                select: {
                    signed_id: true,
                    name: true,
                    description: true,
                    status: true,
                    created_at: true
                }
            },
            Billing: {
                where: {
                    status: {
                        in: ["UNPAID", "OVERDUE"]
                    }
                },
                select: {
                    billing_id: true,
                    amount: true,
                    description: true,
                    status: true,
                    due_date: true,
                    created_at: true
                }
            },
            Updates: {
                orderBy: {
                    created_at: 'desc'
                },
                take: 5,
                select: {
                    update_id: true,
                    message: true,
                    created_at: true
                }
            }
        },
        orderBy: {
            added_at: 'desc'
        }
    });

    res.status(200).json({
        success: true,
        projects: clientProjects
    });
});