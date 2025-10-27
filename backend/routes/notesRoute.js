import express from 'express';
import { 
  createNote, 
  getProjectNotes, 
  getTaskNotes, 
  updateNote, 
  deleteNote, 
  getUserRecentNotes 
} from '../controllers/notesController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import singleUpload from '../middlewares/multerMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new note
router.post('/', singleUpload, createNote);

// Get notes for a project
router.get('/project/:project_id', getProjectNotes);

// Get notes for a task
router.get('/task/:task_id', getTaskNotes);

// Get user's recent notes
router.get('/recent', getUserRecentNotes);

// Update a note
router.put('/:note_id', updateNote);

// Delete a note
router.delete('/:note_id', deleteNote);

export default router;
