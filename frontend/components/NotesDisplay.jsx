"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  StickyNote, 
  Plus, 
  FileText, 
  User, 
  Calendar, 
  Download,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { getProjectNotesRequest, createNoteRequest, deleteNoteRequest } from '@/lib/http/notes';
import { useContextDetection } from '@/hooks/useContextDetection';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const NotesDisplay = ({ projectId, taskId = null, showAddButton = true }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  
  const { context } = useContextDetection();
  const fileInputRef = React.useRef(null);

  const loadNotes = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const response = await getProjectNotesRequest(projectId, {
        task_id: taskId,
        limit: 50
      });
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSaveNote = async () => {
    if (!newNote.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const noteData = {
        project_id: projectId,
        task_id: taskId,
        content: newNote.trim(),
        note_type: 'general',
        file: selectedFile
      };

      await createNoteRequest(noteData);
      setNewNote('');
      setSelectedFile(null);
      setShowAddForm(false);
      
      // Reload notes
      await loadNotes();
      toast.success('Note saved successfully!');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNoteRequest(noteId);
      await loadNotes();
      toast.success('Note deleted successfully!');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Notes</h3>
          <Badge variant="secondary" className="text-xs">
            {notes.length}
          </Badge>
        </div>
        
        {showAddButton && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="space-y-3">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="min-h-20"
            />
            
            {/* File Upload */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              />
              
              {selectedFile ? (
                <div className="flex items-center gap-2 p-2 bg-white rounded border text-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="flex-1 truncate">{selectedFile.name}</span>
                  <button onClick={removeFile} className="text-red-600 hover:text-red-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Attach File
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveNote}
                disabled={!newNote.trim() || isSaving}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? 'Saving...' : 'Save Note'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewNote('');
                  setSelectedFile(null);
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No notes yet</p>
            {showAddButton && (
              <p className="text-sm">Click "Add Note" to create your first note</p>
            )}
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.comment_id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {note.user?.name || 'Unknown User'}
                    </span>
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {note.content}
                  </div>

                  {/* File Attachment */}
                  {note.attachment_url && (
                    <div className="mt-3 flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700 flex-1">
                        {note.attachment_name || 'Attached file'}
                      </span>
                      <Button
                        onClick={() => downloadFile(note.attachment_url, note.attachment_name)}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleDeleteNote(note.comment_id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesDisplay;




