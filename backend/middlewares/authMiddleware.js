import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncError from "./catchAsyncError.js";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/index.js";

export const authMiddleware = catchAsyncError(async (req, res, next) => {
  // Try to get token from Authorization header first, then from cookies
  let token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    token = req.cookies.token;
  }
  
  // Reduced debug logging - only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 Auth Middleware - Token:", token ? "Present" : "Missing");
    console.log("📝 Request:", req.method, req.originalUrl);
  }
  
  if (!token) {
    throw new ErrorHandler('Unauthorized user', 401);
  }
  
  try {
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optimized query - only fetch essential user data
    const user = await prisma.user.findUnique({
      where: {
        user_id: decodeToken.user_id,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        Role: true,
        leader_id: true,
        active_status: true,
        created_at: true, // Add this for role selection logic
        // Include Time field for timer functionality
        Time: {
          where: {
            status: "PROCESSING"
          },
          select: {
            task_id: true,
            start: true,
            status: true,
            end: true,
            time_id: true
          }
        },
        // Remove heavy nested queries - fetch these on-demand in specific endpoints
      }
    });

    if (!user) {
      throw new ErrorHandler('User not found', 404);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("✅ User authenticated:", user.user_id);
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ErrorHandler('Invalid token', 401);
    } else if (error.name === 'TokenExpiredError') {
      throw new ErrorHandler('Token expired', 401);
    } else {
      throw error;
    }
  }
});

// New middleware for endpoints that need full user data
export const authWithFullData = catchAsyncError(async (req, res, next) => {
  // First authenticate with basic data
  await authMiddleware(req, res, async () => {
    // Then fetch full user data only when needed
    const user = await prisma.user.findUnique({
      where: {
        user_id: req.user.user_id,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        bring: true,
        hear_about_as: true,
        focus: true,
        account_name: true,
        Role: true,
        leader_id: true,
        connect_mail_hash: true,
        Projects: {
          select: {
            project_id: true,
            name: true,
            description: true,
            priority: true,
            filingDate: true,
            opposing: true,
            client_name: true,
            client_address: true,
            status: true,
            phases: true,
            created_at: true,
            updated_at: true,
            created_by: true,
            Tasks: {
              select: {
                task_id: true,
                name: true
              }
            },
            Clients: {
              select: {
                project_client_id: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                    user_id: true
                  }
                }
              },
            },
            Members: {
              select: {
                project_member_id: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                    user_id: true
                  }
                }
              },
            },
          },
        },
        Collaboration: {
          select: {
            project_member_id: true,
            role: true,
            legalRole: true,
            customLegalRole: true,
            project: {
              select: {
                project_id: true,
                name: true,
                description: true,
                Tasks: {
                  select: {
                    task_id: true,
                    name: true
                  }
                },
                Clients: {
                  select: {
                    project_client_id: true,
                    user: {
                      select: {
                        name: true,
                        email: true,
                        user_id: true
                      }
                    }
                  },
                },
                Members: {
                  select: {
                    project_member_id: true,
                    user: {
                      select: {
                        name: true,
                        email: true,
                        user_id: true
                      }
                    }
                  },
                },
              },
            },
          },
        },
        Services: {
          select: {
            project_client_id: true,
            added_at: true,
            project: {
              select: {
                project_id: true,
                name: true,
                description: true,
                Tasks: {
                  select: {
                    task_id: true,
                    name: true
                  }
                },
                Clients: {
                  select: {
                    project_client_id: true,
                    user: {
                      select: {
                        name: true,
                        email: true,
                        user_id: true
                      }
                    }
                  },
                },
                Members: {
                  select: {
                    project_member_id: true,
                    user: {
                      select: {
                        name: true,
                        email: true,
                        user_id: true
                      }
                    }
                  },
                },
              },
            },
          },
        },
        Time: {
          where: {
            status: "PROCESSING"
          },
          select: {
            task_id: true,
            start: true,
            status: true,
            end: true,
            time_id: true
          }
        },
        teamsMember: {
          select: {
            team_member_id: true,
            role: true,
            legalRole: true,
            customLegalRole: true,
            leader: {
              select: {
                user_id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    req.user = user;
    next();
  });
});




