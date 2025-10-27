import { prisma } from '../prisma/index.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import { uploadToCloud } from '../services/mediaService.js';

// Create a new note/comment
export const createNote = catchAsyncError(async (req, res, next) => {
  const { project_id, task_id, content } = req.body;
  const user_id = req.user.user_id;
  const file = req.file;

  // Validate required fields
  if (!content || !project_id) {
    return res.status(400).json({
      success: false,
      message: 'Content and project_id are required'
    });
  }

  try {
    // Note: File uploads are not supported in the current Comment model
    // If file upload is needed, consider creating a separate Media model
    // or extending the Comment model to include file fields

    // Create the note/comment with only the fields that exist in the schema
    const noteData = {
      project_id: parseInt(project_id),
      user_id: parseInt(user_id),
      content: content.trim()
    };

    const note = await prisma.comment.create({
      data: noteData,
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

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message
    });
  }
});

// Get notes for a project
export const getProjectNotes = catchAsyncError(async (req, res, next) => {
  const { project_id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required'
    });
  }

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const whereClause = {
      project_id: parseInt(project_id)
    };

    const [notes, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: whereClause,
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
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: skip,
        take: parseInt(limit)
      }),
      prisma.comment.count({
        where: whereClause
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        notes,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCount / parseInt(limit)),
          total_count: totalCount,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
});

// Get notes for a task (Note: Comment model doesn't have task_id, so this returns empty for now)
export const getTaskNotes = catchAsyncError(async (req, res, next) => {
  const { task_id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!task_id) {
    return res.status(400).json({
      success: false,
      message: 'Task ID is required'
    });
  }

  try {
    // Since Comment model doesn't have task_id field, return empty result
    // TODO: Either add task_id to Comment model or create a separate TaskNote model
    res.status(200).json({
      success: true,
      data: {
        notes: [],
        pagination: {
          current_page: parseInt(page),
          total_pages: 0,
          total_count: 0,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
});

// Update a note
export const updateNote = catchAsyncError(async (req, res, next) => {
  const { note_id } = req.params;
  const { content } = req.body;
  const user_id = req.user.user_id;

  if (!note_id || !content) {
    return res.status(400).json({
      success: false,
      message: 'Note ID and content are required'
    });
  }

  try {
    // Check if note exists and user has permission to edit
    const existingNote = await prisma.comment.findFirst({
      where: {
        comment_id: note_id,
        user_id: parseInt(user_id)
      }
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or you do not have permission to edit it'
      });
    }

    const updatedNote = await prisma.comment.update({
      where: {
        comment_id: note_id
      },
      data: {
        content: content.trim()
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

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message
    });
  }
});

// Delete a note
export const deleteNote = catchAsyncError(async (req, res, next) => {
  const { note_id } = req.params;
  const user_id = req.user.user_id;

  if (!note_id) {
    return res.status(400).json({
      success: false,
      message: 'Note ID is required'
    });
  }

  try {
    // Check if note exists and user has permission to delete
    const existingNote = await prisma.comment.findFirst({
      where: {
        comment_id: note_id,
        user_id: parseInt(user_id)
      }
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or you do not have permission to delete it'
      });
    }

    await prisma.comment.delete({
      where: {
        comment_id: note_id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message
    });
  }
});

// Get user's recent notes
export const getUserRecentNotes = catchAsyncError(async (req, res, next) => {
  const user_id = req.user.user_id;
  const { limit = 10 } = req.query;

  try {
    const notes = await prisma.comment.findMany({
      where: {
        user_id: parseInt(user_id)
      },
      include: {
        project: {
          select: {
            project_id: true,
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: notes
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
});
