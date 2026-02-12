import React from 'react';
import { Clock, X, CheckCircle, FileText, Calendar, MessageCircle, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { downloadFile, viewFile } from '../../utils/fileUtils';
import LawFirmTimeline from '../dashboards/timeLine';

// Law Firm Timeline Modal Component
export const LawFirmTimelineModal = ({
  isOpen,
  onClose,
  selectedProject,
  timelineData,
  timelineLoading,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Case Details: {selectedProject?.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onRefresh(selectedProject.project_id)}
                  disabled={timelineLoading}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  {timelineLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Refresh
                </Button>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-[85vh] overflow-y-auto p-6">
            {/* Case Overview */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Case Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedProject?.name}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedProject?.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedProject?.status || 'Unknown'}
                      </span>
                    </p>
                    <p><span className="font-medium">Client:</span> {selectedProject?.client_name || 'N/A'}</p>
                    <p><span className="font-medium">Description:</span> {selectedProject?.description || 'No description available'}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Team Members</h3>
                  <div className="space-y-2">
                    {selectedProject?.Members && selectedProject.Members.length > 0 ? (
                      selectedProject.Members.map((member, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{member.user?.name || 'Unknown'}</span>
                          <span className="text-gray-500">({member.role})</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No team members assigned</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Quick Stats</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Tasks:</span> {selectedProject?.Tasks?.length || 0}</p>
                    <p><span className="font-medium">Documents:</span> {selectedProject?.Media?.length || 0}</p>
                    <p><span className="font-medium">Time Entries:</span> {selectedProject?.Time?.length || 0}</p>
                    <p><span className="font-medium">Comments:</span> {selectedProject?.Comments?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs for different sections */}
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="meetings" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Entries
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Comments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-6">
                {timelineLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-500">Loading timeline data...</p>
                    </div>
                  </div>
                ) : timelineData && (timelineData.progress.length > 0 || timelineData.times.length > 0 || timelineData.documents.length > 0) ? (
                  <LawFirmTimeline
                    selectedProjectForTimeline={selectedProject}
                    onClose={onClose}
                    timelineData={timelineData}
                    timelineLoading={timelineLoading}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Timeline Data Available</h3>
                    <p className="text-gray-500">
                      No timeline data found for this project in the selected date range.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tasks" className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Tasks</h3>
                  {selectedProject?.Tasks && selectedProject.Tasks.length > 0 ? (
                    <div className="space-y-4">
                      {selectedProject.Tasks.map((task, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">{task.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {task.status || 'pending'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{task.description || 'No description'}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                            <span>Priority: {task.priority || 'Medium'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No tasks found for this project</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Documents</h3>
                  {selectedProject?.Media && selectedProject.Media.length > 0 ? (
                    <div className="space-y-4">
                      {selectedProject.Media.map((doc, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">{doc.filename || 'Unnamed Document'}</h4>
                            <span className="text-xs text-gray-500">
                              {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown date'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">{doc.mimeType || 'Unknown type'}</span>
                            <span className="text-xs text-gray-500">
                              {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                            </span>
                            {doc.file_url && (
                              <div className="flex gap-2 ml-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => viewFile(doc.file_url, doc.filename)}
                                  className="h-6 px-2 text-xs"
                                >
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadFile(doc.file_url, doc.filename)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Download
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No documents found for this project</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="meetings" className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Time Entries</h3>
                  {selectedProject?.Time && selectedProject.Time.length > 0 ? (
                    <div className="space-y-4">
                      {selectedProject.Time.map((timeEntry, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">{timeEntry.task?.name || 'General Time Entry'}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              timeEntry.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                              timeEntry.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {timeEntry.status || 'unknown'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Time entry by {timeEntry.user?.name || 'Unknown user'}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Start: {timeEntry.start ? new Date(timeEntry.start).toLocaleString() : 'No start time'}</span>
                            <span>End: {timeEntry.end ? new Date(timeEntry.end).toLocaleString() : 'Ongoing'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No time entries found for this project</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Comments</h3>
                  {selectedProject?.Comments && selectedProject.Comments.length > 0 ? (
                    <div className="space-y-4">
                      {selectedProject.Comments.map((comment, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">Comment by {comment.user?.name || 'Unknown user'}</h4>
                            <span className="text-xs text-gray-500">
                              {comment.created_at 
                                ? new Date(comment.created_at).toLocaleString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : 'Date not available'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{comment.content || 'No content'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No comments found for this project</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
