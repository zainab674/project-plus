'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProjectRequest } from '@/lib/http/project';
import ProjectChat from '@/components/ProjectChat';
import Loader from '@/components/Loader';
import { toast } from 'react-toastify';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';

export default function ProjectChatPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedCase } = useDashboardFilter();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prevent page scrolling when chat page is active
  useEffect(() => {
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    
    // Cleanup: re-enable scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getProjectDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getProjectRequest(params.id);
      setProject(res?.data?.project);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
      router.push(`/dashboard/project/${params.id}`);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  // Load project when params.id changes
  useEffect(() => {
    if (params.id) {
      getProjectDetails();
    }
  }, [params.id, getProjectDetails]);

  // Navigate to new project chat when selectedCase changes in top nav
  useEffect(() => {
    if (selectedCase?.project_id && selectedCase.project_id.toString() !== params.id) {
      // Navigate to the new project's chat page
      router.push(`/dashboard/project/${selectedCase.project_id}/chat`);
    }
  }, [selectedCase?.project_id, params.id, router]);

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Not Found</h3>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden" style={{ top: '8rem', bottom: '0' }}>
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/project/${params.id}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Button>
        <div className="h-6 w-px bg-gray-300" />
        <h1 className="text-xl font-semibold text-gray-900">Project Chat - {project.name}</h1>
      </div>

      {/* Chat Component */}
      <div className="flex-1 overflow-hidden p-4 min-h-0">
        <ProjectChat project={project} />
      </div>
    </div>
  );
}

