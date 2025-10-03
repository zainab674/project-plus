import React, { useCallback, useEffect, useState } from 'react'
import BigDialog from './Dialogs/BigDialog'
import AvatarCompoment from './AvatarCompoment'
import { useUser } from '@/providers/UserProvider'
import { Button } from './Button'
import { Send, MessageCircle, Clock, FileText } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import moment from 'moment'
import { toast } from 'react-toastify'
import { addTaskCommentsRequest, getTaskCommentsRequest } from '@/lib/http/task'
import Loader from './Loader'

const TaskComments = ({ open, onClose, project_id, project }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [comments, setComments] = useState([]);
  const { user } = useUser();
  const [loading, setLoading] = useState(false)

  const handleComment = useCallback(async () => {
    if (!content.trim()) {
      toast.error('Please enter a note');
      return;
    }
    
    setIsLoading(true)
    try {
      const formdata = {
        content,
        project_id: project_id // Using actual project_id for project-level comments
      }

      const res = await addTaskCommentsRequest(formdata);
      await getComments();
      setContent('');
      toast.success(res?.data?.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setIsLoading(false)
    }
  }, [content, project_id]);

  const getComments = useCallback(async () => {
    if (!project_id) return;
    
    setLoading(true)
    try {
      // Using project_id as task_id for the API (backend inconsistency)
      const res = await getTaskCommentsRequest(project_id);
      setComments(res?.data?.comments);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false)
    }
  }, [project_id]);

  useEffect(() => {
    if (project_id) {
      getComments();
    } else {
      setComments([]);
    }
  }, [project_id, getComments]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && content.trim()) {
      e.preventDefault();
      handleComment();
    }
  };

  return (
    <BigDialog open={open} onClose={onClose} className="!max-w-6xl !w-[95vw]">
      <div className="flex flex-col h-[80vh] max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Project Notes & Comments</h3>
              <p className="text-sm text-gray-500">
                {project?.name} • {comments?.length || 0} note{comments?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Project Notes</span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Case:</span> {project?.name}
            </div>
            {project?.status && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Status:</span> {project.status}
              </div>
            )}
          </div>
        </div>

        {/* Comments Container */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2 min-h-0">
          {!loading && comments?.length > 0 && comments.map((comment) => (
            <Card
              className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
              key={comment?.comment_id}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  <AvatarCompoment
                    name={comment?.user?.name}
                    className="!w-8 !h-8 border-2 border-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {comment?.user?.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <time className="text-xs text-gray-500">
                          {moment(comment?.created_at).calendar()}
                        </time>
                      </div>
                    </div>
                    <p className="text-gray-800 mt-2 text-sm leading-relaxed">
                      {comment?.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && comments?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-600 mb-2">No notes yet</h4>
              <p className="text-gray-500 text-sm">
                Be the first to add a note to this project.
              </p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <Loader />
            </div>
          )}
        </div>

        {/* Comment Input - Sticky at bottom */}
        <div className="border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 p-4">
            <AvatarCompoment
              name={user?.name}
              className="!w-8 !h-8 border-2 border-gray-100 flex-shrink-0"
            />
            <div className="flex-1">
              <input
                className="w-full text-gray-900 placeholder:text-gray-500 outline-none border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors"
                placeholder="Add a project note or comment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              disabled={isLoading || !content.trim()}
              isLoading={isLoading}
              onClick={handleComment}
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

export default TaskComments