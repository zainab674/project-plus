import { prisma } from '../prisma/index.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';

class BillingService {

  // Set billing configuration for a case
  async setBillingConfig(caseId, billingMethod, amount, userId) {
    try {
      // Validate inputs
      if (!caseId || !billingMethod) {
        throw new Error('Case ID and billing method are required');
      }

      // Check if the case exists
      const project = await prisma.project.findUnique({
        where: { project_id: parseInt(caseId) },
        include: {
          caseAssignments: {
            include: {
              biller: {
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

      if (!project) {
        throw new Error('Case not found');
      }

      // Check if user is case owner or biller
      const isCaseOwner = project.created_by === userId;
      const isBiller = project.caseAssignments.some(assignment => assignment.biller_id === userId);

      if (!isCaseOwner && !isBiller) {
        throw new Error('You must be the case owner or biller to set billing configuration');
      }

      // Map billing method to BillingType enum
      let billingType;
      switch (billingMethod) {
        case 'PER_TASK':
          billingType = 'TASK_BASED';
          break;
        case 'PER_CASE':
          billingType = 'PROJECT_BASED';
          break;
        case 'HOURLY':
          billingType = 'HOURLY';
          break;
        default:
          throw new Error('Invalid billing method');
      }

      // Validate amount for non-hourly billing
      if (billingMethod !== 'HOURLY' && (!amount || parseFloat(amount) <= 0)) {
        throw new Error('Amount is required and must be greater than 0 for PER_TASK and PER_CASE billing methods');
      }

      // Create or update billing configuration
      const billingConfig = await prisma.billingConfig.upsert({
        where: { project_id: parseInt(caseId) },
        update: {
          is_hourly: billingMethod === 'HOURLY',
          is_fullcase: billingMethod === 'PER_CASE',
          is_taskbase: billingMethod === 'PER_TASK',
          project_fee: billingMethod === 'PER_CASE' ? parseFloat(amount) : null,
          task_amount: billingMethod === 'PER_TASK' ? parseFloat(amount) : null,
          hourly_rate: billingMethod === 'HOURLY' ? (amount ? parseFloat(amount) : null) : null,
          updated_at: new Date()
        },
        create: {
          project_id: parseInt(caseId),
          is_hourly: billingMethod === 'HOURLY',
          is_fullcase: billingMethod === 'PER_CASE',
          is_taskbase: billingMethod === 'PER_TASK',
          project_fee: billingMethod === 'PER_CASE' ? parseFloat(amount) : null,
          task_amount: billingMethod === 'PER_TASK' ? parseFloat(amount) : null,
          hourly_rate: billingMethod === 'HOURLY' ? (amount ? parseFloat(amount) : null) : null,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      return {
        config_id: billingConfig.config_id,
        project_id: billingConfig.project_id,
        is_hourly: billingConfig.is_hourly,
        is_fullcase: billingConfig.is_fullcase,
        is_taskbase: billingConfig.is_taskbase,
        billing_method: billingMethod,
        amount: amount,
        created_at: billingConfig.created_at,
        updated_at: billingConfig.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to set billing configuration: ${error.message}`);
    }
  }

  // Get billing configuration for a case
  async getBillingConfig(caseId, userId) {
    try {
      // Validate inputs
      if (!caseId || !userId) {
        throw new Error('Case ID and user ID are required');
      }

      // Check if the case exists
      const project = await prisma.project.findUnique({
        where: { project_id: parseInt(caseId) },
        include: {
          caseAssignments: {
            include: {
              biller: {
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

      if (!project) {
        throw new Error('Case not found');
      }

      // Check if user is case owner or biller
      const isCaseOwner = project.created_by === userId;
      const isBiller = project.caseAssignments.some(assignment => assignment.biller_id === userId);

      if (!isCaseOwner && !isBiller) {
        throw new Error('You must be the case owner or biller to view billing configuration');
      }

      // Get billing configuration
      const billingConfig = await prisma.billingConfig.findUnique({
        where: { project_id: parseInt(caseId) },
        include: {
          memberRates: {
            include: {
              user: {
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

      return billingConfig;
    } catch (error) {
      throw new Error(`Failed to get billing configuration: ${error.message}`);
    }
  }

  // Assign case to biller
  async assignCaseToBiller(projectId, billerId, assignedBy) {
    try {
      // Check if project exists and user has access
      const project = await prisma.project.findFirst({
        where: {
          project_id: parseInt(projectId),
          OR: [
            { created_by: assignedBy },
            {
              Members: {
                some: {
                  user_id: assignedBy,
                  role: 'PROVIDER'
                }
              }
            }
          ]
        },
        include: {
          Members: true
        }
      });

      if (!project) {
        throw new Error('Project not found or you do not have access');
      }

      // Check if the biller exists
      const biller = await prisma.user.findUnique({
        where: { user_id: parseInt(billerId) }
      });

      if (!biller) {
        throw new Error('Biller not found');
      }

      // Check if the biller is in the user's team
      const teamMember = await prisma.userTeam.findFirst({
        where: {
          user_id: parseInt(billerId),
          leader_id: assignedBy,
          role: 'BILLER'
        }
      });

      if (!teamMember) {
        // Check if the biller is in the team with a different role
        const teamMemberWithDifferentRole = await prisma.userTeam.findFirst({
          where: {
            user_id: parseInt(billerId),
            leader_id: assignedBy
          }
        });

        if (teamMemberWithDifferentRole) {
          throw new Error(`User ${biller.name} is in your team but with role '${teamMemberWithDifferentRole.role}'. They need to have the 'BILLER' role to be assigned cases.`);
        } else {
          throw new Error(`User ${biller.name} is not in your team. Please add them to your team with the 'BILLER' role first.`);
        }
      }

      // Check if case is already assigned to a biller
      const existingAssignment = await prisma.caseAssignment.findFirst({
        where: { project_id: parseInt(projectId) }
      });

      if (existingAssignment) {
        throw new Error('Case is already assigned to a biller');
      }

      // Create the assignment
      const assignment = await prisma.caseAssignment.create({
        data: {
          project_id: parseInt(projectId),
          biller_id: parseInt(billerId),
          assigned_by: assignedBy,
          assigned_at: new Date()
        },
        include: {
          project: {
            select: {
              name: true,
              client_name: true,
              status: true
            }
          },
          biller: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return assignment;
    } catch (error) {
      throw new Error(`Failed to assign case to biller: ${error.message}`);
    }
  }

  // Get cases assigned to billers for a user
  async getBillerAssignedCases(userId) {
    try {
      // Get all case assignments for projects where the user is owner or admin
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [
            { created_by: userId },
            {
              Members: {
                some: {
                  user_id: userId,
                  role: 'PROVIDER'
                }
              }
            }
          ]
        },
        select: { project_id: true }
      });

      const projectIds = userProjects.map(p => p.project_id);

      if (projectIds.length === 0) {
        return [];
      }

      const assignedCases = await prisma.caseAssignment.findMany({
        where: {
          project_id: {
            in: projectIds
          }
        },
        include: {
          project: {
            select: {
              name: true,
              client_name: true,
              status: true
            }
          },
          biller: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          assigned_at: 'desc'
        }
      });

      return assignedCases;
    } catch (error) {
      throw new Error(`Failed to get biller assigned cases: ${error.message}`);
    }
  }

  // Get cases assigned to a specific biller (when they log in)
  async getCasesAssignedToBiller(billerId) {
    try {

      const assignedCases = await prisma.caseAssignment.findMany({
        where: {
          biller_id: parseInt(billerId)
        },
        include: {
          project: {
            select: {
              project_id: true,
              name: true,
              client_name: true,
              status: true,
              priority: true,
              filingDate: true,
              budget: true,
              description: true,
              Members: {
                include: {
                  user: {
                    select: {
                      user_id: true,
                      name: true,
                      email: true,
                      Role: true
                    }
                  }
                }
              }
            }
          },
          assignedBy: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          assigned_at: 'desc'
        }
      });

      console.log('📋 Found assigned cases:', assignedCases.length);
      console.log('📋 Assigned cases details:', JSON.stringify(assignedCases, null, 2));

      return assignedCases;
    } catch (error) {
      console.error('❌ Error in getCasesAssignedToBiller:', error);
      throw new Error(`Failed to get cases assigned to biller: ${error.message}`);
    }
  }

  // Get detailed case information including team members, clients, tasks, and progress
  async getCaseDetails(projectId) {
    const project = await prisma.project.findUnique({
      where: { project_id: projectId },
      include: {
        Members: {
          include: {
            user: { select: { user_id: true, name: true, email: true } }
          }
        },
        Clients: {
          include: {
            user: { select: { user_id: true, name: true, email: true } },
            Documents: {
              orderBy: { created_at: 'desc' }
            },
            Filled: {
              orderBy: { created_at: 'desc' }
            },
            signed: {
              orderBy: { created_at: 'desc' }
            },
            Updates: {
              orderBy: { created_at: 'desc' }
            },
            Billing: {
              orderBy: { created_at: 'desc' }
            }
          }
        },
        Tasks: {
          include: {
            creator: { select: { user_id: true, name: true, email: true } },
            assignees: {
              include: {
                user: { select: { user_id: true, name: true } }
              }
            },
            inReview: {
              include: {
                submitted_by: {
                  select: { user_id: true, name: true, email: true }
                },
                acted_by: {
                  select: { user_id: true, name: true, email: true }
                }
              }
            },
            Meetings: {
              include: {
                user: { select: { user_id: true, name: true, email: true } },
                participants: {
                  include: {
                    user: { select: { user_id: true, name: true, email: true } }
                  }
                }
              },
              orderBy: { created_at: 'desc' }
            },
            Progress: {
              include: {
                user: { select: { user_id: true, name: true } }
              },
              orderBy: { created_at: 'asc' }
            },
            Time: {
              include: {
                user: { select: { user_id: true, name: true } }
              },
              orderBy: { start: 'asc' }
            },
            Media: {
              include: {
                user: { select: { user_id: true, name: true, email: true } }
              },
              orderBy: { created_at: 'desc' }
            },
            Emails: {
              include: {
                user: { select: { user_id: true, name: true, email: true } }
              },
              orderBy: { created_at: 'desc' }
            },
          }
        },
        Comments: {
          include: {
            user: { select: { user_id: true, name: true, email: true } }
          },
          orderBy: { created_at: 'desc' }
        },
      }
    });

    return project;
  };


  // Set member rate for a case
  async setMemberRate(caseId, memberId, rateType, rateValue, userId) {
    try {
      // Validate inputs
      if (!caseId || !memberId || !rateType || !rateValue) {
        throw new Error('Case ID, member ID, rate type, and rate value are required');
      }

      // Check if the case exists
      const project = await prisma.project.findUnique({
        where: { project_id: parseInt(caseId) },
        include: {
          caseAssignments: {
            include: {
              biller: {
                select: {
                  user_id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          Members: {
            include: {
              user: {
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

      if (!project) {
        throw new Error('Case not found');
      }

      // Check if user is case owner or biller
      const isCaseOwner = project.created_by === userId;
      const isBiller = project.caseAssignments.some(assignment => assignment.biller_id === userId);

      if (!isCaseOwner && !isBiller) {
        throw new Error('You must be the case owner or biller to set member rates');
      }

      // Check if the member is part of the case team
      const isTeamMember = project.Members.some(member => member.user_id === parseInt(memberId));
      if (!isTeamMember) {
        throw new Error('Member is not part of this case team');
      }

      // Check if billing configuration exists
      const billingConfig = await prisma.billingConfig.findUnique({
        where: { project_id: parseInt(caseId) }
      });

      if (!billingConfig) {
        throw new Error('Billing configuration must be set before adding member rates');
      }

      // Map rate type to BillingType enum
      let billingType;
      switch (rateType) {
        case 'PER_TASK':
          billingType = 'TASK_BASED';
          break;
        case 'HOURLY':
          billingType = 'HOURLY';
          break;
        default:
          throw new Error('Invalid rate type');
      }

      // Create or update member rate
      const memberRate = await prisma.memberRate.upsert({
        where: {
          config_id_user_id: {
            config_id: billingConfig.config_id,
            user_id: parseInt(memberId)
          }
        },
        update: {
          billing_type: billingType,
          hourly_rate: rateType === 'HOURLY' ? parseFloat(rateValue) : null,
          monthly_salary: rateType === 'PER_TASK' ? parseFloat(rateValue) : null,
          updated_at: new Date()
        },
        create: {
          config_id: billingConfig.config_id,
          user_id: parseInt(memberId),
          billing_type: billingType,
          hourly_rate: rateType === 'HOURLY' ? parseFloat(rateValue) : null,
          monthly_salary: rateType === 'PER_TASK' ? parseFloat(rateValue) : null,
          created_at: new Date(),
          updated_at: new Date()
        },
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return {
        member_rate_id: memberRate.member_rate_id,
        config_id: memberRate.config_id,
        user_id: memberRate.user_id,
        billing_type: memberRate.billing_type,
        rate_type: rateType,
        rate_value: rateValue,
        user: memberRate.user,
        created_at: memberRate.created_at,
        updated_at: memberRate.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to set member rate: ${error.message}`);
    }
  }

  // Get member rates for a case
  async getMemberRates(caseId, userId) {
    try {
      // Check if the case exists
      const project = await prisma.project.findUnique({
        where: { project_id: parseInt(caseId) },
        include: {
          caseAssignments: {
            include: {
              biller: {
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

      if (!project) {
        throw new Error('Case not found');
      }

      // Check if user is case owner or biller
      const isCaseOwner = project.created_by === userId;
      const isBiller = project.caseAssignments.some(assignment => assignment.biller_id === userId);

      if (!isCaseOwner && !isBiller) {
        throw new Error('You must be the case owner or biller to view member rates');
      }

      // Get billing configuration
      const billingConfig = await prisma.billingConfig.findUnique({
        where: { project_id: parseInt(caseId) },
        include: {
          memberRates: {
            include: {
              user: {
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

      if (!billingConfig) {
        return [];
      }

      // Transform the data to match frontend expectations
      const memberRates = billingConfig.memberRates.map(rate => ({
        member_rate_id: rate.member_rate_id,
        user_id: rate.user_id,
        billing_type: rate.billing_type,
        rate_type: rate.billing_type === 'HOURLY' ? 'HOURLY' : 'PER_TASK',
        rate_value: rate.hourly_rate || rate.monthly_salary,
        user: rate.user,
        created_at: rate.created_at,
        updated_at: rate.updated_at
      }));

      return memberRates;
    } catch (error) {
      throw new Error(`Failed to get member rates: ${error.message}`);
    }
  }

  // Auto-generate billing entry for task completion
  async generateTaskBillingEntry(taskId, userId) {
    try {
      // Get task details with project and billing info
      const task = await prisma.task.findUnique({
        where: { task_id: parseInt(taskId) },
        include: {
          project: {
            include: {
              billingConfig: {
                include: {
                  memberRates: true
                }
              }
            }
          },
          taskMembers: {
            include: {
              user: {
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

      if (!task) {
        throw new Error('Task not found');
      }

      if (!task.project.billingConfig) {
        throw new Error('Billing configuration not set for this project');
      }

      const billingConfig = task.project.billingConfig;

      // Determine billing type based on boolean flags
      let billingType;
      if (billingConfig.is_taskbase) {
        billingType = 'TASK_BASED';
      } else if (billingConfig.is_hourly) {
        billingType = 'HOURLY';
      } else if (billingConfig.is_fullcase) {
        billingType = 'PROJECT_BASED';
      } else {
        throw new Error('No billing type configured');
      }

      // Generate billing entry based on billing type
      switch (billingType) {
        case 'TASK_BASED':
          return await this.generateTaskBasedBillingEntry(task, billingConfig);
        case 'HOURLY':
          return await this.generateHourlyBillingEntry(task, billingConfig);
        case 'PROJECT_BASED':
          return await this.generateProjectBasedBillingEntry(task, billingConfig);
        default:
          throw new Error('Unsupported billing type');
      }
    } catch (error) {
      throw new Error(`Failed to generate task billing entry: ${error.message}`);
    }
  }

  // Generate task-based billing entry
  async generateTaskBasedBillingEntry(task, billingConfig) {
    const billingEntries = [];

    // Get member rates for this project
    const memberRates = billingConfig.memberRates;

    for (const taskMember of task.taskMembers) {
      const memberRate = memberRates.find(rate => rate.user_id === taskMember.user_id);

      if (memberRate && memberRate.monthly_salary) {
        // Create billing entry for task completion
        const billingEntry = await prisma.billingLineItem.create({
          data: {
            billing_id: await this.getOrCreateBillingId(task.project_id),
            item_type: 'TASK',
            description: `Task: ${task.name}`,
            quantity: 1,
            unit_rate: memberRate.monthly_salary,
            total_amount: memberRate.monthly_salary,
            user_id: taskMember.user_id,
            task_id: task.task_id,
            created_at: new Date()
          }
        });

        billingEntries.push(billingEntry);
      }
    }

    return billingEntries;
  }

  // Generate hourly billing entry
  async generateHourlyBillingEntry(task, billingConfig) {
    const billingEntries = [];

    // Get time logs for this task
    const timeLogs = await prisma.taskTime.findMany({
      where: { task_id: task.task_id },
      include: {
        user: {
          select: {
            user_id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const memberRates = billingConfig.memberRates;

    for (const timeLog of timeLogs) {
      const memberRate = memberRates.find(rate => rate.user_id === timeLog.user_id);

      if (memberRate && memberRate.hourly_rate) {
        // Calculate hours from duration (assuming duration is in minutes)
        const hours = timeLog.duration / 60;
        const totalAmount = hours * memberRate.hourly_rate;

        const billingEntry = await prisma.billingLineItem.create({
          data: {
            billing_id: await this.getOrCreateBillingId(task.project_id),
            item_type: 'TIME',
            description: `Time: ${task.name} - ${timeLog.user.name}`,
            quantity: hours,
            unit_rate: memberRate.hourly_rate,
            total_amount: totalAmount,
            user_id: timeLog.user_id,
            task_id: task.task_id,
            time_entries: [timeLog.task_time_id.toString()],
            created_at: new Date()
          }
        });

        billingEntries.push(billingEntry);
      }
    }

    return billingEntries;
  }

  // Generate project-based billing entry
  async generateProjectBasedBillingEntry(task, billingConfig) {
    // For project-based billing, we might want to track task completion
    // but not create individual billing entries until project completion
    const billingEntry = await prisma.billingLineItem.create({
      data: {
        billing_id: await this.getOrCreateBillingId(task.project_id),
        item_type: 'PROJECT_TRACKING',
        description: `Task completion: ${task.name}`,
        quantity: 1,
        unit_rate: 0, // No immediate charge for project-based
        total_amount: 0,
        task_id: task.task_id,
        created_at: new Date()
      }
    });

    return [billingEntry];
  }

  // Auto-generate billing entry for meeting
  async generateMeetingBillingEntry(meetingId, userId) {
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { meeting_id: parseInt(meetingId) },
        include: {
          project: {
            include: {
              billingConfig: {
                include: {
                  memberRates: true
                }
              }
            }
          },
          participants: {
            include: {
              user: {
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

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      if (!meeting.project.billingConfig) {
        throw new Error('Billing configuration not set for this project');
      }

      const billingConfig = meeting.project.billingConfig;
      const billingEntries = [];

      // Calculate meeting duration in hours
      const startTime = new Date(meeting.start_time);
      const endTime = new Date(meeting.end_time);
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);

      const memberRates = billingConfig.memberRates;

      for (const participant of meeting.participants) {
        const memberRate = memberRates.find(rate => rate.user_id === participant.user_id);

        if (memberRate && memberRate.hourly_rate) {
          const totalAmount = durationHours * memberRate.hourly_rate;

          const billingEntry = await prisma.billingLineItem.create({
            data: {
              billing_id: await this.getOrCreateBillingId(meeting.project_id),
              item_type: 'MEETING',
              description: `Meeting: ${meeting.title} - ${participant.user.name}`,
              quantity: durationHours,
              unit_rate: memberRate.hourly_rate,
              total_amount: totalAmount,
              user_id: participant.user_id,
              created_at: new Date()
            }
          });

          billingEntries.push(billingEntry);
        }
      }

      return billingEntries;
    } catch (error) {
      throw new Error(`Failed to generate meeting billing entry: ${error.message}`);
    }
  }

  // Auto-generate billing entry for review task
  async generateReviewBillingEntry(reviewId, userId) {
    try {
      const review = await prisma.review.findUnique({
        where: { review_id: parseInt(reviewId) },
        include: {
          task: {
            include: {
              project: {
                include: {
                  billingConfig: {
                    include: {
                      memberRates: true
                    }
                  }
                }
              }
            }
          },
          reviewer: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      if (!review.task.project.billingConfig) {
        throw new Error('Billing configuration not set for this project');
      }

      const billingConfig = review.task.project.billingConfig;
      const memberRate = billingConfig.memberRates.find(rate => rate.user_id === review.reviewer_id);

      if (!memberRate) {
        throw new Error('No billing rate found for reviewer');
      }

      // Review tasks might have different pricing (e.g., 50% of regular task rate)
      const reviewRate = memberRate.monthly_salary ? memberRate.monthly_salary * 0.5 : memberRate.hourly_rate * 0.5;

      const billingEntry = await prisma.billingLineItem.create({
        data: {
          billing_id: await this.getOrCreateBillingId(review.task.project_id),
          item_type: 'REVIEW',
          description: `Review: ${review.task.name} - ${review.reviewer.name}`,
          quantity: 1,
          unit_rate: reviewRate,
          total_amount: reviewRate,
          user_id: review.reviewer_id,
          task_id: review.task_id,
          created_at: new Date()
        }
      });

      return [billingEntry];
    } catch (error) {
      throw new Error(`Failed to generate review billing entry: ${error.message}`);
    }
  }

  // Generate billing entry for progress activities
  async generateProgressBillingEntry(progressId, userId) {
    try {
      // Get progress entry with related data
      const progress = await prisma.taskProgress.findUnique({
        where: { progress_id: progressId },
        include: {
          task: {
            include: {
              project: {
                include: {
                  billingConfig: {
                    include: {
                      memberRates: true
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!progress) {
        throw new Error('Progress entry not found');
      }

      // Check if user has permission to bill this progress
      const project = progress.task.project;
      if (!project) {
        throw new Error('Project not found');
      }

      // Check if user is case owner or biller
      const isOwner = project.created_by === userId;
      const isBiller = await prisma.caseAssignment.findFirst({
        where: {
          project_id: project.project_id,
          biller_id: userId
        }
      });

      if (!isOwner && !isBiller) {
        throw new Error('Unauthorized to bill this progress entry');
      }

      // Check if billing is already generated for this progress
      let progressPrefix = "Progress:";
      switch (progress.type) {
        case 'MAIL':
          progressPrefix = "Email Progress:";
          break;
        case 'MEETING':
          progressPrefix = "Meeting Progress:";
          break;
        case 'CHAT':
          progressPrefix = "Chat Progress:";
          break;
        case 'CALL':
          progressPrefix = "Call Progress:";
          break;
        case 'COMMENT':
          progressPrefix = "Comment Progress:";
          break;
        case 'TRANSCRIBTION':
          progressPrefix = "Transcription Progress:";
          break;
        case 'STATUS_CHANGED':
          progressPrefix = "Status Change Progress:";
          break;
        case 'MEDIA':
          progressPrefix = "Media Progress:";
          break;
        case 'OTHER':
        default:
          progressPrefix = "Other Progress:";
          break;
      }

      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `${progressPrefix} ${progress.message}`
          }
        }
      });

      if (existingBilling) {
        throw new Error('Billing entry already exists for this progress');
      }

      const billingConfig = project.billingConfig;
      if (!billingConfig) {
        throw new Error('No billing configuration found for this project');
      }

      // Get member rate for the user who created the progress
      const memberRate = billingConfig.memberRates.find(rate => rate.user_id === progress.user_id);
      if (!memberRate) {
        throw new Error('No member rate found for this user');
      }

      // Calculate billing based on progress type
      let billingAmount = 0;
      let billingType = 'PROGRESS';
      let description = `Progress: ${progress.message}`;

      switch (progress.type) {
        case 'MAIL':
          billingAmount = memberRate.per_task_rate || 0;
          billingType = 'MAIL';
          description = `Email Progress: ${progress.message}`;
          break;
        case 'MEETING':
          billingAmount = memberRate.per_task_rate || 0;
          billingType = 'MEETING';
          description = `Meeting Progress: ${progress.message}`;
          break;
        case 'CHAT':
          billingAmount = memberRate.per_task_rate || 0;
          billingType = 'CHAT';
          description = `Chat Progress: ${progress.message}`;
          break;
        case 'CALL':
          billingAmount = memberRate.per_task_rate || 0;
          billingType = 'CALL';
          description = `Call Progress: ${progress.message}`;
          break;
        case 'COMMENT':
          billingAmount = memberRate.per_task_rate || 0;
          billingType = 'COMMENT';
          description = `Comment Progress: ${progress.message}`;
          break;
        case 'TRANSCRIBTION':
          billingAmount = memberRate.per_task_rate || 0;
          billingType = 'TRANSCRIPTION';
          description = `Transcription Progress: ${progress.message}`;
          break;
        case 'STATUS_CHANGED':
          billingAmount = memberRate.per_task_rate || 0;
          billingType = 'STATUS_CHANGE';
          description = `Status Change Progress: ${progress.message}`;
          break;
        case 'MEDIA':
          billingAmount = memberRate.per_task_rate || 0;
          billingType = 'MEDIA';
          description = `Media Progress: ${progress.message}`;
          break;
        case 'OTHER':
        default:
          billingAmount = memberRate.per_task_rate || 0;
          billingType = 'OTHER';
          description = `Other Progress: ${progress.message}`;
          break;
      }

      if (billingAmount <= 0) {
        throw new Error('No billing amount configured for this progress type');
      }

      // Get or create billing record
      const billingId = await this.getOrCreateBillingId(project.project_id);

      // Create billing line item
      const billingLineItem = await prisma.billingLineItem.create({
        data: {
          billing_id: billingId,
          user_id: progress.user_id,
          task_id: progress.task_id,
          item_type: billingType,
          description: description,
          quantity: 1,
          unit_rate: billingAmount,
          total_amount: billingAmount,
          created_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Progress billing entry generated successfully',
        billingLineItem
      };
    } catch (error) {
      throw new Error(`Failed to generate progress billing entry: ${error.message}`);
    }
  }

  // Generate billing for task creation
  async generateTaskCreationBillingEntry(taskId, userId) {
    try {
      const task = await prisma.task.findUnique({
        where: { task_id: parseInt(taskId) },
        include: {
          creator: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          project: {
            include: {
              billingConfig: {
                include: {
                  memberRates: true
                }
              }
            }
          }
        }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Check if user has permission to bill this task
      const project = task.project;
      const isOwner = project.created_by === userId;
      const isBiller = await prisma.caseAssignment.findFirst({
        where: {
          project_id: project.project_id,
          biller_id: userId
        }
      });

      if (!isOwner && !isBiller) {
        throw new Error('Unauthorized to bill this task');
      }

      // Check if billing is already generated for this task creation
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Task Creation: ${task.name}`
          }
        }
      });

      if (existingBilling) {
        throw new Error('Billing entry already exists for this task creation');
      }

      const billingConfig = project.billingConfig;
      if (!billingConfig) {
        throw new Error('No billing configuration found for this project');
      }

      // Get member rate for the task creator
      const memberRate = billingConfig.memberRates.find(rate => rate.user_id === task.created_by);
      if (!memberRate) {
        throw new Error('No member rate found for task creator');
      }

      const billingAmount = memberRate.per_task_rate || 0;
      if (billingAmount <= 0) {
        throw new Error('No billing amount configured for task creation');
      }

      // Get or create billing record
      const billingId = await this.getOrCreateBillingId(project.project_id);

      // Create billing line item
      const billingLineItem = await prisma.billingLineItem.create({
        data: {
          billing_id: billingId,
          user_id: task.created_by,
          task_id: task.task_id,
          item_type: 'TASK_CREATION',
          description: `Task Creation: ${task.name}`,
          quantity: 1,
          unit_rate: billingAmount,
          total_amount: billingAmount,
          created_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Task creation billing entry generated successfully',
        billingLineItem
      };
    } catch (error) {
      throw new Error(`Failed to generate task creation billing entry: ${error.message}`);
    }
  }

  // Generate billing for task updates
  async generateTaskUpdateBillingEntry(taskId, userId, updateType = 'GENERAL') {
    try {
      const task = await prisma.task.findUnique({
        where: { task_id: parseInt(taskId) },
        include: {
          creator: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          project: {
            include: {
              billingConfig: {
                include: {
                  memberRates: true
                }
              }
            }
          }
        }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Check if user has permission to bill this task
      const project = task.project;
      const isOwner = project.created_by === userId;
      const isBiller = await prisma.caseAssignment.findFirst({
        where: {
          project_id: project.project_id,
          biller_id: userId
        }
      });

      if (!isOwner && !isBiller) {
        throw new Error('Unauthorized to bill this task');
      }

      const billingConfig = project.billingConfig;
      if (!billingConfig) {
        throw new Error('No billing configuration found for this project');
      }

      // Get member rate for the task creator
      const memberRate = billingConfig.memberRates.find(rate => rate.user_id === task.created_by);
      if (!memberRate) {
        throw new Error('No member rate found for task creator');
      }

      // Calculate billing amount based on update type
      let billingAmount = 0;
      let description = `Task Update: ${task.name}`;

      switch (updateType) {
        case 'STATUS_CHANGE':
          billingAmount = (memberRate.per_task_rate || 0) * 0.25; // 25% of task rate
          description = `Task Status Update: ${task.name}`;
          break;
        case 'PRIORITY_CHANGE':
          billingAmount = (memberRate.per_task_rate || 0) * 0.15; // 15% of task rate
          description = `Task Priority Update: ${task.name}`;
          break;
        case 'ASSIGNMENT_CHANGE':
          billingAmount = (memberRate.per_task_rate || 0) * 0.20; // 20% of task rate
          description = `Task Assignment Update: ${task.name}`;
          break;
        case 'DESCRIPTION_CHANGE':
          billingAmount = (memberRate.per_task_rate || 0) * 0.10; // 10% of task rate
          description = `Task Description Update: ${task.name}`;
          break;
        default:
          billingAmount = (memberRate.per_task_rate || 0) * 0.10; // 10% of task rate
          description = `Task Update: ${task.name}`;
      }

      if (billingAmount <= 0) {
        throw new Error('No billing amount configured for task updates');
      }

      // Get or create billing record
      const billingId = await this.getOrCreateBillingId(project.project_id);

      // Create billing line item
      const billingLineItem = await prisma.billingLineItem.create({
        data: {
          billing_id: billingId,
          user_id: task.created_by,
          task_id: task.task_id,
          item_type: 'TASK_UPDATE',
          description: description,
          quantity: 1,
          unit_rate: billingAmount,
          total_amount: billingAmount,
          created_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Task update billing entry generated successfully',
        billingLineItem
      };
    } catch (error) {
      throw new Error(`Failed to generate task update billing entry: ${error.message}`);
    }
  }

  // Generate billing for comment creation
  async generateCommentBillingEntry(commentId, userId) {
    try {
      const comment = await prisma.comment.findUnique({
        where: { comment_id: commentId },
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          task: {
            include: {
              project: {
                include: {
                  billingConfig: {
                    include: {
                      memberRates: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      // Check if user has permission to bill this comment
      const project = comment.task.project;
      const isOwner = project.created_by === userId;
      const isBiller = await prisma.caseAssignment.findFirst({
        where: {
          project_id: project.project_id,
          biller_id: userId
        }
      });

      if (!isOwner && !isBiller) {
        throw new Error('Unauthorized to bill this comment');
      }

      // Check if billing is already generated for this comment
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Comment: ${comment.comment_id}`
          }
        }
      });

      if (existingBilling) {
        throw new Error('Billing entry already exists for this comment');
      }

      const billingConfig = project.billingConfig;
      if (!billingConfig) {
        throw new Error('No billing configuration found for this project');
      }

      // Get member rate for the comment creator
      const memberRate = billingConfig.memberRates.find(rate => rate.user_id === comment.user_id);
      if (!memberRate) {
        throw new Error('No member rate found for comment creator');
      }

      const billingAmount = (memberRate.per_task_rate || 0) * 0.05; // 5% of task rate for comments
      if (billingAmount <= 0) {
        throw new Error('No billing amount configured for comments');
      }

      // Get or create billing record
      const billingId = await this.getOrCreateBillingId(project.project_id);

      // Create billing line item
      const billingLineItem = await prisma.billingLineItem.create({
        data: {
          billing_id: billingId,
          user_id: comment.user_id,
          task_id: comment.task_id,
          item_type: 'COMMENT',
          description: `Comment: ${comment.content.substring(0, 50)}...`,
          quantity: 1,
          unit_rate: billingAmount,
          total_amount: billingAmount,
          created_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Comment billing entry generated successfully',
        billingLineItem
      };
    } catch (error) {
      throw new Error(`Failed to generate comment billing entry: ${error.message}`);
    }
  }

  // Generate billing for email creation
  async generateEmailBillingEntry(emailId, userId) {
    try {
      const email = await prisma.email.findUnique({
        where: { email_id: emailId },
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          task: {
            include: {
              project: {
                include: {
                  billingConfig: {
                    include: {
                      memberRates: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!email) {
        throw new Error('Email not found');
      }

      // Check if user has permission to bill this email
      const project = email.task.project;
      const isOwner = project.created_by === userId;
      const isBiller = await prisma.caseAssignment.findFirst({
        where: {
          project_id: project.project_id,
          biller_id: userId
        }
      });

      if (!isOwner && !isBiller) {
        throw new Error('Unauthorized to bill this email');
      }

      // Check if billing is already generated for this email
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Email: ${email.email_id}`
          }
        }
      });

      if (existingBilling) {
        throw new Error('Billing entry already exists for this email');
      }

      const billingConfig = project.billingConfig;
      if (!billingConfig) {
        throw new Error('No billing configuration found for this project');
      }

      // Get member rate for the email creator
      const memberRate = billingConfig.memberRates.find(rate => rate.user_id === email.user_id);
      if (!memberRate) {
        throw new Error('No member rate found for email creator');
      }

      const billingAmount = (memberRate.per_task_rate || 0) * 0.15; // 15% of task rate for emails
      if (billingAmount <= 0) {
        throw new Error('No billing amount configured for emails');
      }

      // Get or create billing record
      const billingId = await this.getOrCreateBillingId(project.project_id);

      // Create billing line item
      const billingLineItem = await prisma.billingLineItem.create({
        data: {
          billing_id: billingId,
          user_id: email.user_id,
          task_id: email.task_id,
          item_type: 'EMAIL',
          description: `Email: ${email.subject}`,
          quantity: 1,
          unit_rate: billingAmount,
          total_amount: billingAmount,
          created_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Email billing entry generated successfully',
        billingLineItem
      };
    } catch (error) {
      throw new Error(`Failed to generate email billing entry: ${error.message}`);
    }
  }

  // Generate billing for transcription creation
  async generateTranscriptionBillingEntry(transcriptionId, userId) {
    try {
      const transcription = await prisma.transcibtion.findUnique({
        where: { transcribtion_id: transcriptionId },
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          task: {
            include: {
              project: {
                include: {
                  billingConfig: {
                    include: {
                      memberRates: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!transcription) {
        throw new Error('Transcription not found');
      }

      // Check if user has permission to bill this transcription
      const project = transcription.task.project;
      const isOwner = project.created_by === userId;
      const isBiller = await prisma.caseAssignment.findFirst({
        where: {
          project_id: project.project_id,
          biller_id: userId
        }
      });

      if (!isOwner && !isBiller) {
        throw new Error('Unauthorized to bill this transcription');
      }

      // Check if billing is already generated for this transcription
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Transcription: ${transcription.transcribtion_id}`
          }
        }
      });

      if (existingBilling) {
        throw new Error('Billing entry already exists for this transcription');
      }

      const billingConfig = project.billingConfig;
      if (!billingConfig) {
        throw new Error('No billing configuration found for this project');
      }

      // Get member rate for the transcription creator
      const memberRate = billingConfig.memberRates.find(rate => rate.user_id === transcription.user_id);
      if (!memberRate) {
        throw new Error('No member rate found for transcription creator');
      }

      const billingAmount = (memberRate.per_task_rate || 0) * 0.30; // 30% of task rate for transcriptions
      if (billingAmount <= 0) {
        throw new Error('No billing amount configured for transcriptions');
      }

      // Get or create billing record
      const billingId = await this.getOrCreateBillingId(project.project_id);

      // Create billing line item
      const billingLineItem = await prisma.billingLineItem.create({
        data: {
          billing_id: billingId,
          user_id: transcription.user_id,
          task_id: transcription.task_id,
          item_type: 'TRANSCRIPTION',
          description: `Transcription: ${transcription.name}`,
          quantity: 1,
          unit_rate: billingAmount,
          total_amount: billingAmount,
          created_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Transcription billing entry generated successfully',
        billingLineItem
      };
    } catch (error) {
      throw new Error(`Failed to generate transcription billing entry: ${error.message}`);
    }
  }

  // Generate billing for media upload
  async generateMediaBillingEntry(mediaId, userId) {
    try {
      const media = await prisma.media.findUnique({
        where: { media_id: mediaId },
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          task: {
            include: {
              project: {
                include: {
                  billingConfig: {
                    include: {
                      memberRates: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!media) {
        throw new Error('Media not found');
      }

      // Check if user has permission to bill this media
      const project = media.project;
      const isOwner = project.created_by === userId;
      const isBiller = await prisma.caseAssignment.findFirst({
        where: {
          project_id: project.project_id,
          biller_id: userId
        }
      });

      if (!isOwner && !isBiller) {
        throw new Error('Unauthorized to bill this media');
      }

      // Check if billing is already generated for this media
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Media: ${media.media_id}`
          }
        }
      });

      if (existingBilling) {
        throw new Error('Billing entry already exists for this media');
      }

      const billingConfig = project.billingConfig;
      if (!billingConfig) {
        throw new Error('No billing configuration found for this project');
      }

      // Get member rate for the media uploader
      const memberRate = billingConfig.memberRates.find(rate => rate.user_id === media.user_id);
      if (!memberRate) {
        throw new Error('No member rate found for media uploader');
      }

      const billingAmount = (memberRate.per_task_rate || 0) * 0.10; // 10% of task rate for media
      if (billingAmount <= 0) {
        throw new Error('No billing amount configured for media');
      }

      // Get or create billing record
      const billingId = await this.getOrCreateBillingId(project.project_id);

      // Create billing line item
      const billingLineItem = await prisma.billingLineItem.create({
        data: {
          billing_id: billingId,
          user_id: media.user_id,
          task_id: media.task_id,
          item_type: 'MEDIA',
          description: `Media Upload: ${media.filename}`,
          quantity: 1,
          unit_rate: billingAmount,
          total_amount: billingAmount,
          created_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Media billing entry generated successfully',
        billingLineItem
      };
    } catch (error) {
      throw new Error(`Failed to generate media billing entry: ${error.message}`);
    }
  }

  // Comprehensive method to bill all project activities
  async generateComprehensiveProjectBilling(projectId, userId) {
    try {
      // Get comprehensive project data
      const project = await prisma.project.findFirst({
        where: {
          project_id: parseInt(projectId),
          OR: [
            { created_by: userId },
            {
              Members: {
                some: {
                  user_id: userId
                }
              }
            }
          ]
        },
        include: {
          Tasks: {
            include: {
              creator: {
                select: {
                  user_id: true,
                  name: true,
                  email: true
                }
              },
              inReview: {
                select: {
                  review_id: true,
                  action: true,
                  created_at: true
                }
              },
              Meetings: {
                include: {
                  participants: {
                    include: {
                      user: {
                        select: {
                          user_id: true,
                          name: true,
                          email: true
                        }
                      }
                    }
                  }
                }
              },
              Progress: {
                select: {
                  progress_id: true,
                  type: true,
                  created_at: true,
                  user_id: true
                }
              },
              Time: {
                select: {
                  time_id: true,
                  status: true,
                  created_at: true,
                  user_id: true
                }
              },
              Comments: {
                select: {
                  comment_id: true,
                  created_at: true,
                  user_id: true
                }
              },
              Emails: {
                select: {
                  email_id: true,
                  created_at: true,
                  user_id: true
                }
              },
              Transcibtions: {
                select: {
                  transcribtion_id: true,
                  created_at: true,
                  user_id: true
                }
              },
              Media: {
                select: {
                  media_id: true,
                  created_at: true,
                  user_id: true
                }
              }
            }
          },
          billingConfig: {
            include: {
              memberRates: true
            }
          }
        }
      });

      if (!project) {
        // Check if user is assigned biller
        const billerAssignment = await prisma.caseAssignment.findFirst({
          where: {
            project_id: parseInt(projectId),
            biller_id: userId
          }
        });

        if (!billerAssignment) {
          throw new Error('Project not found or access denied');
        }

        // Get project as biller
        const projectAsBiller = await prisma.project.findUnique({
          where: { project_id: parseInt(projectId) },
          include: {
            Tasks: {
              include: {
                creator: {
                  select: {
                    user_id: true,
                    name: true,
                    email: true
                  }
                },
                inReview: {
                  select: {
                    review_id: true,
                    action: true,
                    created_at: true
                  }
                },
                Meetings: {
                  include: {
                    participants: {
                      include: {
                        user: {
                          select: {
                            user_id: true,
                            name: true,
                            email: true
                          }
                        }
                      }
                    }
                  }
                },
                Progress: {
                  select: {
                    progress_id: true,
                    type: true,
                    created_at: true,
                    user_id: true
                  }
                },
                Time: {
                  select: {
                    time_id: true,
                    status: true,
                    created_at: true,
                    user_id: true
                  }
                },
                Comments: {
                  select: {
                    comment_id: true,
                    created_at: true,
                    user_id: true
                  }
                },
                Emails: {
                  select: {
                    email_id: true,
                    created_at: true,
                    user_id: true
                  }
                },
                Transcibtions: {
                  select: {
                    transcribtion_id: true,
                    created_at: true,
                    user_id: true
                  }
                },
                Media: {
                  select: {
                    media_id: true,
                    created_at: true,
                    user_id: true
                  }
                }
              }
            },
            billingConfig: {
              include: {
                memberRates: true
              }
            }
          }
        });

        if (!projectAsBiller) {
          throw new Error('Project not found');
        }

        return await this.processComprehensiveBilling(projectAsBiller, userId);
      }

      return await this.processComprehensiveBilling(project, userId);
    } catch (error) {
      throw new Error(`Failed to generate comprehensive project billing: ${error.message}`);
    }
  }

  // Helper method to process comprehensive billing
  async processComprehensiveBilling(project, userId) {
    const billingConfig = project.billingConfig;
    if (!billingConfig) {
      throw new Error('No billing configuration found for this project');
    }

    const billingId = await this.getOrCreateBillingId(project.project_id);
    const billingEntries = [];
    const errors = [];

    // Process each task and its activities
    for (const task of project.Tasks) {
      try {
        // Bill task creation
        const taskCreatorRate = billingConfig.memberRates.find(rate => rate.user_id === task.created_by);
        if (taskCreatorRate && taskCreatorRate.per_task_rate > 0) {
          const existingTaskCreationBilling = await prisma.billingLineItem.findFirst({
            where: {
              description: {
                contains: `Task Creation: ${task.name}`
              }
            }
          });

          if (!existingTaskCreationBilling) {
            const taskCreationBilling = await prisma.billingLineItem.create({
              data: {
                billing_id: billingId,
                user_id: task.created_by,
                task_id: task.task_id,
                item_type: 'TASK_CREATION',
                description: `Task Creation: ${task.name}`,
                quantity: 1,
                unit_rate: taskCreatorRate.per_task_rate,
                total_amount: taskCreatorRate.per_task_rate,
                created_at: new Date()
              }
            });
            billingEntries.push(taskCreationBilling);
          }
        }

        // Process task activities
        await this.processTaskActivities(task, billingConfig, billingId, billingEntries);
      } catch (error) {
        errors.push(`Task ${task.task_id}: ${error.message}`);
      }
    }

    return {
      success: true,
      message: `Comprehensive billing generated successfully. ${billingEntries.length} entries created.`,
      billingEntries,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // Helper method to process task activities
  async processTaskActivities(task, billingConfig, billingId, billingEntries) {
    // Process reviews
    for (const review of task.inReview || []) {
      if (review.action === 'APPROVED' || review.action === 'REJECTED') {
        const existingBilling = await prisma.billingLineItem.findFirst({
          where: {
            description: {
              contains: `Review: ${review.review_id}`
            }
          }
        });

        if (!existingBilling) {
          const memberRate = billingConfig.memberRates.find(rate => rate.user_id === task.created_by);
          if (memberRate && memberRate.per_task_rate > 0) {
            const reviewBilling = await prisma.billingLineItem.create({
              data: {
                billing_id: billingId,
                user_id: task.created_by,
                task_id: task.task_id,
                item_type: 'REVIEW',
                description: `Review: ${review.action} - ${task.name}`,
                quantity: 1,
                unit_rate: memberRate.per_task_rate * 0.25,
                total_amount: memberRate.per_task_rate * 0.25,
                created_at: new Date()
              }
            });
            billingEntries.push(reviewBilling);
          }
        }
      }
    }

    // Process meetings
    for (const meeting of task.Meetings || []) {
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Meeting: ${meeting.meeting_id}`
          }
        }
      });

      if (!existingBilling) {
        const memberRate = billingConfig.memberRates.find(rate => rate.user_id === meeting.user_id);
        if (memberRate && memberRate.per_task_rate > 0) {
          const meetingBilling = await prisma.billingLineItem.create({
            data: {
              billing_id: billingId,
              user_id: meeting.user_id,
              task_id: task.task_id,
              item_type: 'MEETING',
              description: `Meeting: ${meeting.heading}`,
              quantity: 1,
              unit_rate: memberRate.per_task_rate * 0.20,
              total_amount: memberRate.per_task_rate * 0.20,
              created_at: new Date()
            }
          });
          billingEntries.push(meetingBilling);
        }
      }
    }

    // Process progress entries
    for (const progress of task.Progress || []) {
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Progress: ${progress.progress_id}`
          }
        }
      });

      if (!existingBilling) {
        const memberRate = billingConfig.memberRates.find(rate => rate.user_id === progress.user_id);
        if (memberRate && memberRate.per_task_rate > 0) {
          const progressBilling = await prisma.billingLineItem.create({
            data: {
              billing_id: billingId,
              user_id: progress.user_id,
              task_id: task.task_id,
              item_type: progress.type,
              description: `${progress.type} Progress: ${task.name}`,
              quantity: 1,
              unit_rate: memberRate.per_task_rate * 0.05,
              total_amount: memberRate.per_task_rate * 0.05,
              created_at: new Date()
            }
          });
          billingEntries.push(progressBilling);
        }
      }
    }

    // Process time entries
    for (const time of task.Time || []) {
      if (time.status === 'ENDED') {
        const existingBilling = await prisma.billingLineItem.findFirst({
          where: {
            description: {
              contains: `Time: ${time.time_id}`
            }
          }
        });

        if (!existingBilling) {
          const memberRate = billingConfig.memberRates.find(rate => rate.user_id === time.user_id);
          if (memberRate && memberRate.hourly_rate > 0) {
            const startTime = new Date(time.start);
            const endTime = new Date(time.end);
            const durationHours = (endTime - startTime) / (1000 * 60 * 60);

            const timeBilling = await prisma.billingLineItem.create({
              data: {
                billing_id: billingId,
                user_id: time.user_id,
                task_id: task.task_id,
                item_type: 'TIME',
                description: `Time Entry: ${task.name}`,
                quantity: durationHours,
                unit_rate: memberRate.hourly_rate,
                total_amount: memberRate.hourly_rate * durationHours,
                created_at: new Date()
              }
            });
            billingEntries.push(timeBilling);
          }
        }
      }
    }

    // Process comments
    for (const comment of task.Comments || []) {
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Comment: ${comment.comment_id}`
          }
        }
      });

      if (!existingBilling) {
        const memberRate = billingConfig.memberRates.find(rate => rate.user_id === comment.user_id);
        if (memberRate && memberRate.per_task_rate > 0) {
          const commentBilling = await prisma.billingLineItem.create({
            data: {
              billing_id: billingId,
              user_id: comment.user_id,
              task_id: task.task_id,
              item_type: 'COMMENT',
              description: `Comment: ${task.name}`,
              quantity: 1,
              unit_rate: memberRate.per_task_rate * 0.05,
              total_amount: memberRate.per_task_rate * 0.05,
              created_at: new Date()
            }
          });
          billingEntries.push(commentBilling);
        }
      }
    }

    // Process emails
    for (const email of task.Emails || []) {
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Email: ${email.email_id}`
          }
        }
      });

      if (!existingBilling) {
        const memberRate = billingConfig.memberRates.find(rate => rate.user_id === email.user_id);
        if (memberRate && memberRate.per_task_rate > 0) {
          const emailBilling = await prisma.billingLineItem.create({
            data: {
              billing_id: billingId,
              user_id: email.user_id,
              task_id: task.task_id,
              item_type: 'EMAIL',
              description: `Email: ${task.name}`,
              quantity: 1,
              unit_rate: memberRate.per_task_rate * 0.15,
              total_amount: memberRate.per_task_rate * 0.15,
              created_at: new Date()
            }
          });
          billingEntries.push(emailBilling);
        }
      }
    }

    // Process transcriptions
    for (const transcription of task.Transcibtions || []) {
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Transcription: ${transcription.transcribtion_id}`
          }
        }
      });

      if (!existingBilling) {
        const memberRate = billingConfig.memberRates.find(rate => rate.user_id === transcription.user_id);
        if (memberRate && memberRate.per_task_rate > 0) {
          const transcriptionBilling = await prisma.billingLineItem.create({
            data: {
              billing_id: billingId,
              user_id: transcription.user_id,
              task_id: task.task_id,
              item_type: 'TRANSCRIPTION',
              description: `Transcription: ${task.name}`,
              quantity: 1,
              unit_rate: memberRate.per_task_rate * 0.30,
              total_amount: memberRate.per_task_rate * 0.30,
              created_at: new Date()
            }
          });
          billingEntries.push(transcriptionBilling);
        }
      }
    }

    // Process media
    for (const media of task.Media || []) {
      const existingBilling = await prisma.billingLineItem.findFirst({
        where: {
          description: {
            contains: `Media: ${media.media_id}`
          }
        }
      });

      if (!existingBilling) {
        const memberRate = billingConfig.memberRates.find(rate => rate.user_id === media.user_id);
        if (memberRate && memberRate.per_task_rate > 0) {
          const mediaBilling = await prisma.billingLineItem.create({
            data: {
              billing_id: billingId,
              user_id: media.user_id,
              task_id: task.task_id,
              item_type: 'MEDIA',
              description: `Media Upload: ${task.name}`,
              quantity: 1,
              unit_rate: memberRate.per_task_rate * 0.10,
              total_amount: memberRate.per_task_rate * 0.10,
              created_at: new Date()
            }
          });
          billingEntries.push(mediaBilling);
        }
      }
    }
  }

  // Helper method to get or create billing ID for a project
  async getOrCreateBillingId(projectId) {
    try {
      // Check if billing already exists for this project
      let billing = await prisma.billing.findFirst({
        where: { project_id: parseInt(projectId) }
      });

      if (!billing) {
        // Get required IDs
        const projectClientId = await this.getProjectClientId(projectId);
        const billerId = await this.getProjectBillerId(projectId);

        // Create new billing record
        billing = await prisma.billing.create({
          data: {
            project_id: parseInt(projectId),
            project_client_id: projectClientId,
            user_id: billerId,
            amount: 0,
            description: `Auto-generated billing for project ${projectId}`,
            status: 'UNPAID',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            billing_type: 'HOURLY',
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            created_at: new Date()
          }
        });
      }

      return billing.billing_id;
    } catch (error) {
      throw new Error(`Failed to get or create billing ID: ${error.message}`);
    }
  }

  // Helper method to get project client ID
  async getProjectClientId(projectId) {
    try {
      const project = await prisma.project.findUnique({
        where: { project_id: parseInt(projectId) },
        include: {
          Clients: {
            take: 1
          }
        }
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // If no client is assigned, create a default client for the project
      if (!project.Clients || project.Clients.length === 0) {
        console.log(`No client assigned to project ${projectId}, creating default client`);

        // Create a default client for the project
        const defaultClient = await prisma.projectClient.create({
          data: {
            project_id: parseInt(projectId),
            user_id: project.created_by, // Use project creator as default client
          }
        });

        return defaultClient.project_client_id;
      }

      return project.Clients[0].project_client_id;
    } catch (error) {
      throw new Error(`Failed to get project client ID: ${error.message}`);
    }
  }

  // Helper method to get project biller ID
  async getProjectBillerId(projectId) {
    try {
      // First check if there's an assigned biller
      const assignment = await prisma.caseAssignment.findFirst({
        where: { project_id: parseInt(projectId) }
      });

      if (assignment) {
        return assignment.biller_id;
      }

      // If no biller is assigned, use the project creator as default
      const project = await prisma.project.findUnique({
        where: { project_id: parseInt(projectId) },
        select: { created_by: true }
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      console.log(`No biller assigned to project ${projectId}, using project creator as default`);
      return project.created_by;
    } catch (error) {
      throw new Error(`Failed to get project biller ID: ${error.message}`);
    }
  }

  // Get billing entries for a project
  async getProjectBillingEntries(projectId, userId) {
    try {
      console.log(`Getting project billing entries for project ${projectId} and user ${userId}`);

      // Check if user has access to this project through multiple patterns
      const project = await prisma.project.findFirst({
        where: {
          project_id: parseInt(projectId),
          OR: [
            // User is project owner
            { created_by: userId },
            // User is project member
            {
              Members: {
                some: {
                  user_id: userId
                }
              }
            }
          ]
        },
        include: {
          caseAssignments: {
            include: {
              biller: {
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

      console.log(`Project found: ${!!project}`);

      // If not found through project membership, check if user is assigned biller
      let isBiller = false;
      if (!project) {
        console.log('Checking biller assignment...');
        const billerAssignment = await prisma.caseAssignment.findFirst({
          where: {
            project_id: parseInt(projectId),
            biller_id: userId
          }
        });

        console.log(`Biller assignment found: ${!!billerAssignment}`);

        if (!billerAssignment) {
          // Let's also check if the project exists at all
          const projectExists = await prisma.project.findUnique({
            where: { project_id: parseInt(projectId) }
          });

          if (!projectExists) {
            throw new Error(`Project with ID ${projectId} does not exist`);
          } else {
            throw new Error(`User ${userId} does not have access to project ${projectId}. User is not owner, member, or assigned biller.`);
          }
        }
        isBiller = true;
      } else {
        // Check if user is biller for this project
        isBiller = project.caseAssignments.some(assignment => assignment.biller_id === userId);
      }

      console.log(`User has access, isBiller: ${isBiller}, fetching billing entries...`);

      // Get billing entries for this project
      const billingEntries = await prisma.billingLineItem.findMany({
        where: {
          billing: {
            project_id: parseInt(projectId)
          }
        },
        include: {
          billing: {
            select: {
              billing_id: true,
              amount: true,
              status: true,
              created_at: true,
              description: true
            }
          },
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          task: {
            select: {
              task_id: true,
              name: true,
              status: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      console.log(`Billing entries fetched: ${billingEntries.length}`);

      return billingEntries;
    } catch (error) {
      console.error(`Error in getProjectBillingEntries: ${error.message}`);
      throw new Error(`Failed to get project billing entries: ${error.message}`);
    }
  }

  async getProjectActivities(projectId, userId) {
    try {
      console.log(`Getting project activities for project ${projectId} and user ${userId}`);

      // Check if user has access to this project through multiple patterns
      const project = await prisma.project.findFirst({
        where: {
          project_id: parseInt(projectId),
          OR: [
            // User is project owner
            { created_by: userId },
            // User is project member
            {
              Members: {
                some: {
                  user_id: userId
                }
              }
            }
          ]
        }
      });

      console.log(`Project found: ${!!project}`);

      // If not found through project membership, check if user is assigned biller
      if (!project) {
        console.log('Checking biller assignment...');
        const billerAssignment = await prisma.caseAssignment.findFirst({
          where: {
            project_id: parseInt(projectId),
            biller_id: userId
          }
        });

        console.log(`Biller assignment found: ${!!billerAssignment}`);

        if (!billerAssignment) {
          // Let's also check if the project exists at all
          const projectExists = await prisma.project.findUnique({
            where: { project_id: parseInt(projectId) }
          });

          if (!projectExists) {
            throw new Error(`Project with ID ${projectId} does not exist`);
          } else {
            throw new Error(`User ${userId} does not have access to project ${projectId}. User is not owner, member, or assigned biller.`);
          }
        }
      }

      console.log('User has access, fetching activities...');

      // Get all activities for the project
      const [tasks, meetings, reviews, timeEntries, progressEntries] = await Promise.all([
        // Tasks
        prisma.task.findMany({
          where: { project_id: parseInt(projectId) },
          include: {
            assignees: {
              include: {
                user: {
                  select: { user_id: true, name: true, email: true }
                }
              }
            },
            creator: {
              select: { user_id: true, name: true, email: true }
            },
            Time: {
              include: {
                user: {
                  select: { user_id: true, name: true, email: true }
                }
              }
            },
            inReview: {
              include: {
                task: {
                  select: { name: true, status: true }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }),

        // Meetings
        prisma.meeting.findMany({
          where: { project_id: parseInt(projectId) },
          include: {
            user: {
              select: { user_id: true, name: true, email: true }
            },
            task: {
              select: { name: true, status: true }
            },
            participants: {
              include: {
                user: {
                  select: { user_id: true, name: true, email: true }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }),

        // Reviews
        prisma.review.findMany({
          where: {
            task: {
              project_id: parseInt(projectId)
            }
          },
          include: {
            task: {
              select: { name: true, status: true, project_id: true }
            }
          },
          orderBy: { created_at: 'desc' }
        }),

        // Time entries
        prisma.taskTime.findMany({
          where: { project_id: parseInt(projectId) },
          include: {
            user: {
              select: { user_id: true, name: true, email: true }
            },
            task: {
              select: { name: true, status: true }
            }
          },
          orderBy: { created_at: 'desc' }
        }),

        // Progress entries
        prisma.taskProgress.findMany({
          where: {
            task: {
              project_id: parseInt(projectId)
            }
          },
          include: {
            user: {
              select: { user_id: true, name: true, email: true }
            },
            task: {
              select: { name: true, status: true }
            }
          },
          orderBy: { created_at: 'desc' }
        })
      ]);

      console.log(`Activities fetched - Tasks: ${tasks.length}, Meetings: ${meetings.length}, Reviews: ${reviews.length}, Time: ${timeEntries.length}, Progress: ${progressEntries.length}`);

      return {
        tasks,
        meetings,
        reviews,
        timeEntries,
        progressEntries
      };
    } catch (error) {
      console.error(`Error in getProjectActivities: ${error.message}`);
      throw new Error(`Failed to get project activities: ${error.message}`);
    }
  }

  // Create custom billing line item for individual activities
  async createCustomBillingLineItem(billingData, userId) {
    try {
      const {
        project_id,
        item_type,
        description,
        quantity,
        unit_rate,
        total_amount,
        user_id,
        task_id,
        time_entries = []
      } = billingData;

      // Validate inputs
      if (!project_id || !item_type || !description || !quantity || !unit_rate || !total_amount) {
        throw new Error('Missing required billing data');
      }

      // Check if the project exists
      const project = await prisma.project.findUnique({
        where: { project_id: parseInt(project_id) }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Get or create billing record for the project
      const billingId = await this.getOrCreateBillingId(parseInt(project_id));

      // Create the billing line item
      const billingLineItem = await prisma.billingLineItem.create({
        data: {
          billing_id: billingId,
          item_type: item_type,
          description: description,
          quantity: parseFloat(quantity),
          unit_rate: parseFloat(unit_rate),
          total_amount: parseFloat(total_amount),
          user_id: user_id ? parseInt(user_id) : null,
          task_id: task_id ? parseInt(task_id) : null,
          time_entries: time_entries,
          created_at: new Date()
        },
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          task: {
            select: {
              task_id: true,
              name: true,
              status: true
            }
          },
          billing: {
            select: {
              billing_id: true,
              project_id: true,
              status: true
            }
          }
        }
      });

      console.log(`Custom billing line item created: ${billingLineItem.line_item_id}`);

      return {
        success: true,
        message: 'Billing line item created successfully',
        billingLineItem
      };
    } catch (error) {
      console.error(`Error in createCustomBillingLineItem: ${error.message}`);
      throw new Error(`Failed to create billing line item: ${error.message}`);
    }
  }

  // Check if an activity has been billed
  async checkActivityBilled(projectId, activityType, activityId) {
    try {
      console.log(`🔍 Backend: Checking billing status for ${activityType} ${activityId} in project ${projectId}`);

      let whereCondition = {
        billing: {
          project_id: parseInt(projectId)
        }
      };

      // Check based on activity type
      switch (activityType) {
        case 'TASK':
          whereCondition.task_id = parseInt(activityId);
          whereCondition.item_type = activityType;
          break;
        case 'TIME':
          whereCondition.time_entries = {
            has: activityId.toString()
          };
          whereCondition.item_type = activityType;
          break;
        case 'PROGRESS':
          // For progress, check by description containing the progress message
          // We'll need to get the progress details first to match the description
          const progressDetails = await prisma.progress.findUnique({
            where: { progress_id: parseInt(activityId) },
            select: { message: true, type: true }
          });
          if (progressDetails) {
            console.log(`🔍 Backend: Progress message for ${activityId}: "${progressDetails.message}"`);
            console.log(`🔍 Backend: Progress type for ${activityId}: "${progressDetails.type}"`);

            // First, let's see all progress billing entries for this project
            const allProgressBillings = await prisma.billingLineItem.findMany({
              where: {
                billing: {
                  project_id: parseInt(projectId)
                },
                description: {
                  contains: "Progress:"
                }
              },
              select: {
                line_item_id: true,
                description: true,
                total_amount: true,
                created_at: true,
                item_type: true
              }
            });

            console.log(`🔍 Backend: All progress billing entries for project ${projectId}:`, allProgressBillings);

            // Use the same logic as generateProgressBillingEntry
            // The actual billing entries are created with patterns like:
            // - "Other Progress: {message}" for type 'OTHER'
            // - "Email Progress: {message}" for type 'MAIL'
            // - "Meeting Progress: {message}" for type 'MEETING'
            // etc.

            let progressPrefix = "Progress:";
            switch (progressDetails.type) {
              case 'MAIL':
                progressPrefix = "Email Progress:";
                break;
              case 'MEETING':
                progressPrefix = "Meeting Progress:";
                break;
              case 'CHAT':
                progressPrefix = "Chat Progress:";
                break;
              case 'CALL':
                progressPrefix = "Call Progress:";
                break;
              case 'COMMENT':
                progressPrefix = "Comment Progress:";
                break;
              case 'TRANSCRIBTION':
                progressPrefix = "Transcription Progress:";
                break;
              case 'STATUS_CHANGED':
                progressPrefix = "Status Change Progress:";
                break;
              case 'MEDIA':
                progressPrefix = "Media Progress:";
                break;
              case 'OTHER':
              default:
                progressPrefix = "Other Progress:";
                break;
            }

            whereCondition.description = {
              contains: `${progressPrefix} ${progressDetails.message}`
            };

            console.log(`🔍 Backend: Looking for billing entries with description containing: "${progressPrefix} ${progressDetails.message}"`);
          } else {
            console.log(`❌ Backend: Progress details not found for ${activityId}`);
          }
          break;
        case 'REVIEW':
          // For review, check by description containing the review submission
          // We'll need to get the review details first to match the description
          const reviewDetails = await prisma.review.findUnique({
            where: { review_id: parseInt(activityId) },
            select: { submissionDesc: true }
          });
          if (reviewDetails) {
            whereCondition.description = {
              contains: `Review: ${reviewDetails.submissionDesc}`
            };
            whereCondition.item_type = activityType;
          }
          break;
        default:
          return {
            billed: false,
            billingItem: null
          };
      }

      console.log(`🔍 Backend: Where condition for ${activityType} ${activityId}:`, JSON.stringify(whereCondition, null, 2));

      const existingBilling = await prisma.billingLineItem.findFirst({
        where: whereCondition,
        select: {
          line_item_id: true,
          description: true,
          total_amount: true,
          created_at: true
        }
      });

      console.log(`🔍 Backend: Existing billing for ${activityType} ${activityId}:`, existingBilling);

      return {
        billed: !!existingBilling,
        billingItem: existingBilling
      };
    } catch (error) {
      console.error('Error checking if activity is billed:', error);
      return {
        billed: false,
        billingItem: null
      };
    }
  }

  // Get project team members
  async getProjectTeamMembers(projectId, userId) {
    try {
      // Check if the project exists
      const project = await prisma.project.findUnique({
        where: { project_id: parseInt(projectId) },
        include: {
          Members: {
            include: {
              user: {
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

      if (!project) {
        throw new Error('Project not found');
      }

      // Check if user has access to this project
      const isCaseOwner = project.created_by === userId;
      const isTeamMember = project.Members.some(member => member.user_id === userId);

      if (!isCaseOwner && !isTeamMember) {
        throw new Error('You do not have access to this project');
      }

      // Return team members
      return project.Members.map(member => ({
        user_id: member.user.user_id,
        name: member.user.name,
        email: member.user.email
      }));

    } catch (error) {
      throw error;
    }
  }

  // Check project billing readiness
  async checkProjectBillingReadiness(projectId) {
    try {
      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { project_id: parseInt(projectId) },
        include: {
          billingConfig: {
            include: {
              memberRates: true
            }
          }
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Check if billing configuration exists
      if (!project.billingConfig) {
        return {
          ready: false,
          message: 'No billing configuration found for this project',
          missingConfig: true
        };
      }

      // Check if member rates are configured
      if (!project.billingConfig.memberRates || project.billingConfig.memberRates.length === 0) {
        return {
          ready: false,
          message: 'No member rates configured for this project',
          missingRates: true
        };
      }

      return {
        ready: true,
        message: 'Project is ready for billing',
        billingConfig: project.billingConfig
      };
    } catch (error) {
      throw error;
    }
  }

  // Update billing entry
  async updateBillingEntry(lineItemId, updateData, userId) {
    try {
      console.log(`✏️ Backend: Attempting to update billing entry ${lineItemId} by user ${userId}`);

      // Get the billing line item with related data
      const billingLineItem = await prisma.billingLineItem.findUnique({
        where: { line_item_id: lineItemId.toString() },
        include: {
          billing: {
            include: {
              projectClient: {
                include: {
                  project: true
                }
              }
            }
          },
          user: {
            select: {
              user_id: true,
              name: true
            }
          }
        }
      });

      if (!billingLineItem) {
        console.log(`❌ Backend: Billing entry ${lineItemId} not found`);
        throw new Error('Billing entry not found');
      }

      console.log(`✅ Backend: Found billing entry ${lineItemId} for project ${billingLineItem.billing.project_id}`);

      const project = billingLineItem.billing.projectClient.project;
      if (!project) {
        throw new Error('Project not found for this billing entry');
      }

      // Check if user has permission to update this billing entry
      const isOwner = project.created_by === userId;
      const isBiller = await prisma.caseAssignment.findFirst({
        where: {
          project_id: project.project_id,
          biller_id: userId
        }
      });

      console.log(`🔐 Backend: User ${userId} - isOwner: ${isOwner}, isBiller: ${!!isBiller}`);

      if (!isOwner && !isBiller) {
        throw new Error('Unauthorized to update this billing entry');
      }

      // Calculate new total amount
      const quantity = parseFloat(updateData.quantity);
      const unitRate = parseFloat(updateData.unit_rate);
      const totalAmount = quantity * unitRate;

      // Update the billing line item
      const updatedEntry = await prisma.billingLineItem.update({
        where: { line_item_id: lineItemId.toString() },
        data: {
          description: updateData.description,
          quantity: quantity,
          unit_rate: unitRate,
          total_amount: totalAmount
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });

      console.log(`✅ Backend: Successfully updated billing entry ${lineItemId}`);

      return {
        success: true,
        message: 'Billing entry updated successfully',
        updatedEntry
      };
    } catch (error) {
      console.error(`❌ Backend: Error updating billing entry ${lineItemId}:`, error.message);
      throw new Error(`Failed to update billing entry: ${error.message}`);
    }
  }

  // Delete billing entry
  async deleteBillingEntry(lineItemId, userId) {
    try {
      console.log(`🗑️ Backend: Attempting to delete billing entry ${lineItemId} by user ${userId}`);

      // Get the billing line item with related data
      const billingLineItem = await prisma.billingLineItem.findUnique({
        where: { line_item_id: lineItemId.toString() },
        include: {
          billing: {
            include: {
              projectClient: {
                include: {
                  project: true
                }
              }
            }
          },
          user: {
            select: {
              user_id: true,
              name: true
            }
          }
        }
      });

      if (!billingLineItem) {
        console.log(`❌ Backend: Billing entry ${lineItemId} not found`);
        throw new Error('Billing entry not found');
      }

      console.log(`✅ Backend: Found billing entry ${lineItemId} for project ${billingLineItem.billing.project_id}`);

      const project = billingLineItem.billing.projectClient.project;
      if (!project) {
        throw new Error('Project not found for this billing entry');
      }

      // Check if user has permission to delete this billing entry
      const isOwner = project.created_by === userId;
      const isBiller = await prisma.caseAssignment.findFirst({
        where: {
          project_id: project.project_id,
          biller_id: userId
        }
      });

      console.log(`🔐 Backend: User ${userId} - isOwner: ${isOwner}, isBiller: ${!!isBiller}`);

      if (!isOwner && !isBiller) {
        throw new Error('Unauthorized to delete this billing entry');
      }

      // Delete the billing line item
      const deletedEntry = await prisma.billingLineItem.delete({
        where: { line_item_id: lineItemId.toString() },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });

      console.log(`✅ Backend: Successfully deleted billing entry ${lineItemId}`);

      return {
        success: true,
        message: 'Billing entry deleted successfully',
        deletedEntry
      };
    } catch (error) {
      console.error(`❌ Backend: Error deleting billing entry ${lineItemId}:`, error.message);
      throw new Error(`Failed to delete billing entry: ${error.message}`);
    }
  }

  // Get client billing activities for a specific project
  async getClientBillingActivities(projectId, userId) {
    try {
      console.log(`Getting client billing activities for project ${projectId} and user ${userId}`);

      // First, get the project_client_id for this user and project
      const projectClient = await prisma.projectClient.findFirst({
        where: {
          project_id: parseInt(projectId),
          user_id: userId
        },
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              project_id: true,
              name: true
            }
          }
        }
      });

      if (!projectClient) {
        throw new Error(`User ${userId} is not a client for project ${projectId}`);
      }

      console.log(`✅ Client access verified for project ${projectId}, project_client_id: ${projectClient.project_client_id}`);

      // Get all billing activities for this project (regardless of assignment status)
      const billingActivities = await prisma.billingLineItem.findMany({
        where: {
          billing: {
            project_id: parseInt(projectId)
          }
        },
        include: {
          billing: {
            select: {
              billing_id: true,
              amount: true,
              status: true,
              created_at: true,
              description: true,
              project_client_id: true
            }
          },
          user: {
            select: {
              user_id: true,
              name: true,
              email: true
            }
          },
          task: {
            select: {
              task_id: true,
              name: true,
              status: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      console.log(`✅ Found ${billingActivities.length} billing activities for project ${projectId} (all activities)`);

      // Transform the data to match the frontend expectations
      const transformedActivities = billingActivities.map(activity => ({
        billing_activity_id: activity.line_item_id,
        description: activity.description,
        amount: activity.total_amount, // Use total_amount instead of amount
        hours: activity.quantity,
        rate: activity.unit_rate,
        status: activity.billing.status,
        created_at: activity.created_at,
        task_name: activity.task?.name || null,
        user_name: activity.user?.name || null
      }));

      return transformedActivities;
    } catch (error) {
      console.error(`❌ Error in getClientBillingActivities: ${error.message}`);
      throw new Error(`Failed to get client billing activities: ${error.message}`);
    }
  }
}

export default new BillingService(); 