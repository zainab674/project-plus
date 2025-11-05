import React, { useCallback, useEffect, useState } from 'react'
import BigDialog from './Dialogs/BigDialog'
import AvatarCompoment from './AvatarCompoment'
import { useUser } from '@/providers/UserProvider'
import { Button } from './Button'
import { Send, StickyNote, Clock, FileText } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import moment from 'moment'
import { toast } from 'react-toastify'
import { addTaskNoteRequest, getTaskNotesRequest } from '@/lib/http/task'
import Loader from './Loader'

const TaskNotes = ({ open, onClose, task_id, task }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState([]);
  const { user } = useUser();
  const [loading, setLoading] = useState(false)

  const handleNote = useCallback(async () => {
    if (!content.trim()) {
      toast.error('Please enter a note');
      return;
    }
    
    setIsLoading(true)
    try {
      const formdata = {
        content,
        task_id: task_id
      }

      const res = await addTaskNoteRequest(formdata);
      await getNotes();
      setContent('');
      toast.success(res?.data?.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setIsLoading(false)
    }
  }, [content, task_id]);

  const getNotes = useCallback(async () => {
    if (!task_id) return;
    
    setLoading(true)
    try {
      const res = await getTaskNotesRequest(task_id);
      setNotes(res?.data?.notes || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false)
    }
  }, [task_id]);

  useEffect(() => {
    if (task_id) {
      getNotes();
    } else {
      setNotes([]);
    }
  }, [task_id, getNotes]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && content.trim()) {
      e.preventDefault();
      handleNote();
    }
  };

  return (
    <BigDialog open={open} onClose={onClose} className="!max-w-6xl !w-[95vw]">
      <div className="flex flex-col h-[80vh] max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Task Notes</h3>
              <p className="text-sm text-gray-500">
                {task?.name} • {notes?.length || 0} note{notes?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Task Info */}
        <div className="py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Task Notes</span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Task:</span> {task?.name}
            </div>
            {task?.status && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Status:</span> {task.status}
              </div>
            )}
          </div>
        </div>

        {/* Notes Container */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2 min-h-0">
          {!loading && notes?.length > 0 && notes.map((note) => (
            <Card
              className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
              key={note?.comment_id}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  <AvatarCompoment
                    name={note?.user?.name}
                    className="!w-8 !h-8 border-2 border-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {note?.user?.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <time className="text-xs text-gray-500">
                          {moment(note?.created_at).calendar()}
                        </time>
                      </div>
                    </div>
                    <p className="text-gray-800 mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                      {note?.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && notes?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <StickyNote className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-600 mb-2">No notes yet</h4>
              <p className="text-gray-500 text-sm">
                Be the first to add a note to this task.
              </p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <Loader />
            </div>
          )}
        </div>

        {/* Note Input - Sticky at bottom */}
        <div className="border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 p-4">
            <AvatarCompoment
              name={user?.name}
              className="!w-8 !h-8 border-2 border-gray-100 flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                className="w-full text-gray-900 placeholder:text-gray-500 outline-none border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-colors resize-none"
                placeholder="Add a task note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
              />
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              disabled={isLoading || !content.trim()}
              isLoading={isLoading}
              onClick={handleNote}
            >
              <Send className="w-4 h-4" />
              Add Note
            </Button>
          </div>
          <p className="text-xs text-gray-500 px-4 pb-3">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </BigDialog>
  )
}

export default TaskNotes

