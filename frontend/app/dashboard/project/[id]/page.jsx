


"use client"

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, User, Calendar, FileText, ChevronRight, MoreVertical, UserPlus, Users, Mail, FileIcon, Image, Menu, X, ArrowBigLeft, ArrowLeft, AlertCircle, Ellipsis, Users2, MailPlus, Link, Trash2, Play, MessageCircle, ChevronDown, Briefcase } from 'lucide-react';
import CaseDetail from '@/components/caseDetail';

import CreateCaseModal from '@/components/cases/createCaseModal';
import { useUser } from '@/providers/UserProvider';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
import BigDialog from '@/components/Dialogs/BigDialog';
import CreateTask from '@/components/Dialogs/CreateTask';
import { getProjectRequest, deleteProjectRequest, updateProjectRequest, getAllProjectRequest } from '@/lib/http/project';
import UpdateCaseModal from '@/components/cases/updateCaseModal';
import Loader from '@/components/Loader';
import RenderMembers from '@/components/RenderMembers';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import InviteComponet from '@/components/InviteComponet';
import RenderMemberDetails from '@/components/RenderMemberDetails';
import RenderClient from '@/components/RenderClient';
import CreateMeeting from '@/components/CreateMeeting';
import CreateMeetingClient from '@/components/CreateMeetingClient';
import SendMail from '@/components/SendMail';
import SendMailClient from '@/components/SendMailClient';
import TaskComments from '@/components/TaskComments';
import NotesDisplay from '@/components/NotesDisplay';
import { Button } from '@/components/Button';
import { useParams, useRouter } from 'next/navigation';
import TaskManagementView from '@/components/TaskManagement';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ChatModal from '@/components/modals/chatModal';


export default function Page({ params }) {
  // Simplified state management
  const [isLoading, setIsLoading] = useState(false);

  // UI state
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [showUpdateCaseForm, setShowUpdateCaseForm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const { user, loadUser } = useUser();
  const { selectedCase: globalSelectedCase, setSelectedCase: setGlobalSelectedCase } = useDashboardFilter();
  const [project, setProject] = useState(null);
  const [allCases, setAllCases] = useState([]);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewMember, setViewMember] = useState(false);
  const [viewClient, setViewClient] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [createMeeting, setCreateMeeting] = useState(false);
  const [createMeetingClient, setCreateMeetingClient] = useState(false);
  const [scheduleMeeting, setScheduleMeeting] = useState(false);
  const [scheduleMeetingClient, setScheduleMeetingClient] = useState(false);
  const [sendMail, setSendMail] = useState(false);
  const [sendMailClient, setSendMailClient] = useState(false);
  const [selectedTaskOpen, setSelectedTaskOpen] = useState(false);
  const id = useParams();
  const router = useRouter();

  const getProjectDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getProjectRequest(params.id);
      setProject(res?.data?.project);
      // Don't set selectedCase here to avoid loops
    } catch (error) {
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  const getAllCases = useCallback(async () => {
    try {
      const res = await getAllProjectRequest();
      setAllCases(res?.data?.projects || []);
    } catch (error) {
      setAllCases([]);
    }
  }, []);

  const handleDeleteProject = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteProjectRequest(params.id);
      toast.success('Project deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [params.id, router]);

  const handleMakeCaseActive = useCallback(async () => {
    setIsActivating(true);
    try {
      await updateProjectRequest({ status: 'Active' }, params.id);
      toast.success('Case activated successfully');
      getProjectDetails(); // Refresh project data
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to activate case');
    } finally {
      setIsActivating(false);
    }
  }, [params.id, getProjectDetails]);

  useEffect(() => {
    getProjectDetails();
    getAllCases();
  }, [getProjectDetails, getAllCases]); // Re-fetch when functions change

  // Listen to global case selection changes and navigate if different case is selected
  useEffect(() => {
    if (globalSelectedCase && globalSelectedCase.project_id !== params.id) {
      // A different case was selected from the global dropdown
      router.push(`/dashboard/project/${globalSelectedCase.project_id}`);
    }
  }, [globalSelectedCase, params.id, router]);

  // Sync local selectedCase with global when project loads (only once when project_id changes)
  useEffect(() => {
    if (project && project.project_id === params.id && globalSelectedCase?.project_id !== params.id) {
      // Only update global state if the project matches the current URL and it's not already set
      setGlobalSelectedCase(project);
    }
  }, [project?.project_id, params.id, globalSelectedCase?.project_id, setGlobalSelectedCase]);

  if (isLoading) {
    return (
      <div className="h-screen bg-white m-2 rounded-md flex items-center justify-center">
        <Loader />
      </div>
    );
  }



  return (
    <>
      <div className="min-h-screen bg-slate-100">
        {/* Project Overview */}
        <div className="bg-white rounded-lg border border-gray-300 p-6 mb-6">
          <div className="px-6 py-2 flex justify-between items-center">
            <h2 className="text-xl font-semibold mb-4">Case Overview</h2>
            <div className="flex gap-3">

              <Button
                className="bg-tbutton-bg text-tbutton-text hover:bg-tbutton-hover hover:text-tbutton-text transition-all"
                onClick={() => setSelectedTaskOpen(true)}
              >
                Notes
              </Button>

              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-2"
                onClick={() => setShowChatModal(true)}
              >
                <MessageCircle className="w-4 h-4" />
                Internal Chat
              </Button>
              {user?.Role !== "CLIENT" && (
                <>
                  <button
                    onClick={() => setShowNewTaskForm(true)}
                    className="bg-white hover:bg-slate-50 border border-slate-500 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    New Task
                  </button>
                  <button
                    onClick={() => setShowUpdateCaseForm(true)}
                    className="bg-white hover:bg-slate-50 border border-slate-500 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Edit Case
                  </button>
                  {project?.status !== 'Active' && (
                    <button
                      onClick={handleMakeCaseActive}
                      disabled={isActivating}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4" />
                      {isActivating ? 'Activating...' : 'Make Case Active'}
                    </button>
                  )}
                  {project?.status === 'Active' && (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                      Case Active
                    </div>
                  )}
                  {user?.Role !== "CLIENT" && (

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Case
                    </button>
                  )}

                  <button onClick={() => setViewClient(true)} className="flex items-center gap-2">
                    <RenderMembers members={project?.Clients || []} />
                  </button>

                  <button onClick={() => setViewMember(true)}>
                    <RenderMembers members={project?.Members || []} />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="hover:bg-transparent text-black">
                      <button className="mt-2 cursor-pointer p-4 border border-black">More Actions</button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mr-2 mt-2 bg-white border-primary">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-black">Action</DropdownMenuLabel>

                        <DropdownMenuItem
                          className="cursor-pointer text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                          onClick={() => { setInviteOpen(true); setIsClient(true); }}
                        >
                          <Users2 className="mr-2 h-4 w-4" />
                          <span>Invite Client</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="cursor-pointer text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                          onClick={() => { setInviteOpen(true); setIsClient(false); }}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Invite Team Member</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="cursor-pointer text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                          onClick={() => setCreateMeeting(true)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <span>Create Team Meeting</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                          onClick={() => setCreateMeetingClient(true)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Create Client Meeting</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                          onClick={() => setScheduleMeeting(true)}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>Schedule Team Meeting</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                          onClick={() => setScheduleMeetingClient(true)}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>Schedule Client Meeting</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                          onClick={() => setSendMail(true)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          <span>Send Team Mail</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                          onClick={() => setSendMailClient(true)}
                        >
                          <MailPlus className="mr-2 h-4 w-4" />
                          <span>Send Client Mail</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <Separator className="my-2" />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-black">Links</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer text-black hover:!bg-tbutton-bg">
                          <a
                            href={`/dashboard/create-document/${project?.project_id}`}
                            className="flex text-black items-center justify-start gap-2 w-full"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            <span className="text-black">Create Template Document</span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-black hover:!bg-tbutton-bg">
                          <a
                            href={`/dashboard/projects/media/${project?.project_id}`}
                            className="flex items-center justify-start gap-2 w-full"
                          >
                            <Image className="mr-2 h-4 w-4" />
                            <span className="text-black">Media Box</span>
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </>
              )}
            </div>
          </div>

          {/* Case Selection Dropdown */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Select Case:</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <Briefcase className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">
                      {project ? project.name : "Select a case"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 shadow-lg">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900">All Cases</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {allCases.length} cases available
                    </p>
                  </div>
                  
                  {allCases.length === 0 ? (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      No cases found
                    </div>
                  ) : (
                    allCases.map((caseItem) => (
                      <DropdownMenuItem
                        key={caseItem.project_id}
                        onClick={() => router.push(`/dashboard/project/${caseItem.project_id}`)}
                        className={`px-3 py-2 cursor-pointer ${
                          project?.project_id === caseItem.project_id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{caseItem.name}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              caseItem.status === 'Active' ? 'bg-green-100 text-green-800' :
                              caseItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              caseItem.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {caseItem.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 truncate mt-1">
                            {caseItem.client_name} • ID: {caseItem.project_id}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {project &&
            <CaseDetail selectedCase={project} />
          }

         

        </div>
        {showUpdateCaseForm && (
          <UpdateCaseModal
            onClose={async () => {
              setShowUpdateCaseForm(false);
              getProjectDetails(); // Refresh project data after update
            }}
            caseToUpdate={project}
          />
        )}


        <TaskManagementView
          ccproject={project}
          reloadProject={getProjectDetails}
          getProjectDetails={getProjectDetails}

        />

        {/* Task Creation Modal */}
        {showNewTaskForm && (
          <CreateTask
            project={project}
            onClose={async () => {
              setShowNewTaskForm(false);
              getProjectDetails();
            }}
          />
        )}

        <InviteComponet
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          project={project}
          isClient={isClient}
        />


      </div>


      <BigDialog open={viewMember} onClose={() => setViewMember(false)} width={34}>
        <RenderMemberDetails members={project?.Members || []} />
      </BigDialog>

      <BigDialog open={viewClient} onClose={() => setViewClient(false)} width={45}>
        <RenderClient members={(project?.Clients || [])} />
      </BigDialog>

      <CreateMeeting
        open={createMeeting}
        onClose={() => setCreateMeeting(false)}
        isScheduled={false}
        getMeetings={() => { }}
        project_id={project?.project_id}
      />
           <CreateMeetingClient
        open={createMeetingClient}
        onClose={() => setCreateMeetingClient(false)}
        isScheduled={false}
        getMeetings={() => { }}
        project_id={project?.project_id}
        Clients={project?.Clients}
      />

      <CreateMeeting
        open={scheduleMeeting}
        onClose={() => setScheduleMeeting(false)}
        isScheduled={true}
        getMeetings={() => { }}
        project_id={project?.project_id}
      />

      <CreateMeetingClient
        open={scheduleMeetingClient}
        onClose={() => setScheduleMeetingClient(false)}
        isScheduled={true}
        getMeetings={() => { }}
        project_id={project?.project_id}
        Clients={project?.Clients}
      />

      <SendMail
        open={sendMail}
        onClose={() => setSendMail(false)}
        getAllMail={() => { }}
        project_id={project?.project_id}
        tasks={project?.Tasks}
      />

      <SendMailClient
        open={sendMailClient}
        onClose={() => setSendMailClient(false)}
        getAllMail={() => { }}
        project_id={project?.project_id}
        clients={project?.Clients || []}
        tasks={project?.Tasks}
      />

      {selectedTaskOpen && (
        <TaskComments
          open={selectedTaskOpen}
          onClose={() => setSelectedTaskOpen(false)}
          project_id={project?.project_id}
          project={project}
        />
      )}



      {/* New Case Modal */}
      {showNewCaseForm && (
        <CreateCaseModal
          onClose={async () => {
            setShowNewCaseForm(false);
            getProjectDetails();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Case
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete "{project?.name}"? This action cannot be undone and will permanently remove the case and all associated data including tasks, members, and files.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      {showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          project={project}
        />
      )}

    </>
  );
}