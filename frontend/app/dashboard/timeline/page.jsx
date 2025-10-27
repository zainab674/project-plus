"use client"
import { getAllTaskProgressRequest } from '@/lib/http/task';
import { getRecentDatesWithLabels } from '@/utils/getRecentDatesWithLabels';
import React, { useMemo, useState } from 'react'
import { Select, SelectGroup, SelectLabel, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import moment from 'moment';
import Loader from '@/components/Loader';
import { getHourMinDiff } from '@/utils/calculateTIme';
import Timer from '@/components/Timer';
import { useUser } from '@/providers/UserProvider';
import { Input } from '@/components/ui/input';

// Utility function to download files with proper filename
const downloadFile = async (url, filename) => {
  try {
    
    // Always prioritize the provided filename over URL extraction
    let finalFilename = filename;
    
    // Only extract from URL if no filename is provided at all
    if (!finalFilename && url) {
      const urlParts = url.split('/');
      finalFilename = urlParts[urlParts.length - 1];
      // Remove query parameters if any
      finalFilename = finalFilename.split('?')[0];
    }
    
    
    // First try the blob approach
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    });
    
    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      // Fallback to direct link approach
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename || 'document';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    
  } catch (error) {
    console.error('Download error:', error);
    // Fallback to direct link approach
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
      // Last resort - open in new tab
      window.open(url, '_blank');
    }
  }
};

// Utility function to view files in new tab
const viewFile = async (url, filename) => {
  try {
    
    // Check if it's a Cloudinary URL that might force download
    const isCloudinaryUrl = url.includes('cloudinary.com') && url.includes('raw/upload');
    
    if (isCloudinaryUrl) {
      // For Cloudinary URLs, fetch the content and display it inline
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        
        const contentType = response.headers.get('content-type') || '';
        const fileContent = await response.text();
        
        // Create a new window and display the content inline
        const newWindow = window.open('', '_blank');
        
        if (newWindow) {
          // Create a simpler approach using data attributes
          const escapedContent = fileContent.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const escapedContentType = contentType.replace(/"/g, '&quot;');
          const escapedUrl = url.replace(/"/g, '&quot;');
          const escapedFilename = (filename || 'document').replace(/"/g, '&quot;');
          
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${filename || 'Document Viewer'}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
                .viewer-container { 
                  max-width: 1200px; 
                  margin: 0 auto; 
                  background: white; 
                  border-radius: 8px; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  overflow: hidden;
                }
                .header { 
                  background: #f8f9fa; 
                  padding: 15px 20px; 
                  border-bottom: 1px solid #dee2e6;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                .content { 
                  padding: 20px; 
                  min-height: 400px;
                  overflow: auto;
                }
                .fallback { 
                  text-align: center; 
                  padding: 50px; 
                  color: #6c757d;
                }
                .fallback a { 
                  color: #0066cc; 
                  text-decoration: none; 
                  margin: 0 10px;
                }
                .fallback a:hover { 
                  text-decoration: underline; 
                }
                .btn {
                  padding: 8px 16px;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  text-decoration: none;
                  display: inline-block;
                  font-size: 14px;
                }
                .btn-primary {
                  background: #007bff;
                  color: white;
                }
                .btn-secondary {
                  background: #6c757d;
                  color: white;
                }
                .btn:hover {
                  opacity: 0.9;
                }
                pre {
                  white-space: pre-wrap;
                  word-wrap: break-word;
                  font-family: 'Courier New', monospace;
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 4px;
                  border: 1px solid #e9ecef;
                }
              </style>
            </head>
            <body>
              <div class="viewer-container">
                <div class="header">
                  <h3 style="margin: 0; color: #495057;">${filename || 'Document Viewer'}</h3>
                  <div>
                    <a href="${url}" download="${filename || 'document'}" class="btn btn-secondary">Download</a>
                    <button onclick="window.close()" class="btn btn-primary">Close</button>
                  </div>
                </div>
                <div class="content" id="content" 
                     data-content="${escapedContent}" 
                     data-content-type="${escapedContentType}" 
                     data-url="${escapedUrl}" 
                     data-filename="${escapedFilename}">
                  <!-- Content will be loaded here -->
                </div>
              </div>
              <script>
                function getContentDisplay(content, contentType, url, filename) {
                  if (contentType.includes('text/plain') || contentType.includes('text/csv')) {
                    return '<pre>' + escapeHtml(content) + '</pre>';
                  } else if (contentType.includes('text/html')) {
                    return content;
                  } else if (contentType.includes('application/json')) {
                    try {
                      const json = JSON.parse(content);
                      return '<pre>' + escapeHtml(JSON.stringify(json, null, 2)) + '</pre>';
                    } catch (e) {
                      return '<pre>' + escapeHtml(content) + '</pre>';
                    }
                  } else if (contentType.includes('image/')) {
                    return '<img src="' + url + '" style="max-width: 100%; height: auto;" alt="Image preview" />';
                  } else if (contentType.includes('pdf')) {
                    return '<iframe src="' + url + '" style="width: 100%; height: 600px; border: none;"></iframe>';
                  } else {
                    return '<div class="fallback"><h4>Preview not available</h4><p>This file type cannot be previewed in the browser.</p><a href="' + url + '" download="' + filename + '">Download File</a></div>';
                  }
                }
                
                function escapeHtml(text) {
                  const div = document.createElement('div');
                  div.textContent = text;
                  return div.innerHTML;
                }
                
                // Load content after page is ready
                document.addEventListener('DOMContentLoaded', function() {
                  const contentDiv = document.getElementById('content');
                  const content = contentDiv.getAttribute('data-content');
                  const contentType = contentDiv.getAttribute('data-content-type');
                  const url = contentDiv.getAttribute('data-url');
                  const filename = contentDiv.getAttribute('data-filename');
                  
                  const displayContent = getContentDisplay(content, contentType, url, filename);
                  contentDiv.innerHTML = displayContent;
                });
              </script>
            </body>
            </html>
          `);
          newWindow.document.close();
        } else {
          // Fallback if popup is blocked
          window.open(url, '_blank');
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        // Fallback to direct link approach
        window.open(url, '_blank');
      }
    } else {
      // For non-Cloudinary URLs, use the original iframe approach
      const newWindow = window.open('', '_blank');
      
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${filename || 'Document Viewer'}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .viewer-container { width: 100%; height: 100vh; }
              iframe { width: 100%; height: 100%; border: none; }
              .fallback { text-align: center; padding: 50px; }
              .fallback a { color: #0066cc; text-decoration: none; }
              .fallback a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="viewer-container">
              <iframe src="${url}" onerror="showFallback()"></iframe>
            </div>
            <div class="fallback" id="fallback" style="display: none;">
              <h3>File Preview Not Available</h3>
              <p>This file cannot be previewed in the browser.</p>
              <a href="${url}" download="${filename || 'document'}">Download File</a>
            </div>
            <script>
              function showFallback() {
                document.getElementById('fallback').style.display = 'block';
                document.querySelector('.viewer-container').style.display = 'none';
              }
            </script>
          </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // Fallback if popup is blocked
        window.open(url, '_blank');
      }
    }
    
  } catch (error) {
    console.error('View error:', error);
    // Fallback to direct link approach
    window.open(url, '_blank');
  }
};

const page = () => {
  const [progress, setProgress] = React.useState([]);
  const [dates, setDates] = React.useState(getRecentDatesWithLabels(90));
  const [selectedDate, setSelectedDate] = React.useState(dates[0]);
  const [selectedEndDate, setSelectedEndDate] = React.useState(dates[0]);
  const [selectedType, setSelectedType] = React.useState(null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [times, setTimes] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [username, setUsername] = useState("");
  const [progressUsername, setProgressUsername] = useState("");
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const { user } = useUser();

  const filterTimes = useMemo(() => {
    if (!times || !Array.isArray(times)) return [];
    
    let filteredTimes = times;
    
    // Apply username filter
    if (username) {
      filteredTimes = filteredTimes.map(project => ({
        ...project,
        Time: project.Time ? project.Time.filter(time => time.user?.name.toLowerCase().includes(username.toLowerCase())) : []
      })).filter(project => project.Time && project.Time.length > 0);
    }
    
    // Apply global search filter
    if (globalSearchTerm) {
      filteredTimes = filteredTimes.map(project => ({
        ...project,
        Time: project.Time ? project.Time.filter(time => 
          time.user?.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
          time.task?.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
          time.work_description?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
          project.name.toLowerCase().includes(globalSearchTerm.toLowerCase())
        ) : []
      })).filter(project => project.Time && project.Time.length > 0);
    }
    
    return filteredTimes;
  },[times, username, globalSearchTerm]);

  const filterProgress = useMemo(() => {
    if (!progress || !Array.isArray(progress)) return [];
    
    let filteredProgress = progress;
    
    // Apply progressUsername filter
    if (progressUsername) {
      filteredProgress = filteredProgress.map(project => ({
        ...project,
        Tasks: project.Tasks ? project.Tasks.map(task => ({
          ...task,
          Progress: task.Progress ? task.Progress.filter(progress => progress.user?.name.toLowerCase().includes(progressUsername.toLowerCase())) : []
        })).filter(task => task.Progress && task.Progress.length > 0) : []
      })).filter(project => project.Tasks && project.Tasks.some(task => task.Progress && task.Progress.length > 0));
    }
    
    // Apply global search filter
    if (globalSearchTerm) {
      filteredProgress = filteredProgress.map(project => ({
        ...project,
        Tasks: project.Tasks ? project.Tasks.map(task => ({
          ...task,
          Progress: task.Progress ? task.Progress.filter(progress => 
            progress.user?.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
            progress.message?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
            progress.type?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
            task.name?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
            project.name.toLowerCase().includes(globalSearchTerm.toLowerCase())
          ) : []
        })).filter(task => task.Progress && task.Progress.length > 0) : []
      })).filter(project => project.Tasks && project.Tasks.some(task => task.Progress && task.Progress.length > 0));
    }
    
    return filteredProgress;
  }, [progress, progressUsername, globalSearchTerm]);

  const filterDocuments = useMemo(() => {
    if (!documents || !Array.isArray(documents)) return [];
    
    let filteredDocuments = documents;
    
    // Apply global search filter
    if (globalSearchTerm) {
      filteredDocuments = filteredDocuments.map(project => ({
        ...project,
        Clients: project.Clients ? project.Clients.map(client => ({
          ...client,
          Documents: client.Documents ? client.Documents.filter(document => 
            document.name?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
            document.description?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
            document.status?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
            project.name.toLowerCase().includes(globalSearchTerm.toLowerCase())
          ) : []
        })).filter(client => client.Documents && client.Documents.length > 0) : []
      })).filter(project => project.Clients && project.Clients.some(client => client.Documents && client.Documents.length > 0));
    }
    
    return filteredDocuments;
  }, [documents, globalSearchTerm]);

  const getProgress = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await getAllTaskProgressRequest(selectedDate?.date, selectedEndDate.date, selectedType, selectedProject);
      
      // Add safety checks for the response data
      setProgress(res.data?.progress || [])
      setTimes(res.data?.times || []);
      setDocuments(res.data?.documents || [])
    } catch (error) {
      // Set empty arrays on error to prevent undefined errors
      setProgress([])
      setTimes([]);
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate?.date, selectedType, selectedProject, selectedEndDate?.date]);

  React.useEffect(() => {
    getProgress();
  }, [selectedDate?.date, selectedType, selectedProject, selectedEndDate?.date]);

  if (loading) {
    return <>
      <div className="h-screen bg-secondary m-2 rounded-md flex items-center justify-center">
        <Loader />
      </div>
    </>
  }

  return (
    <div className="h-screen bg-secondary m-2 rounded-md overflow-y-auto p-8">
      <div className="flex justify-between flex-1 mt-5">
        <h1 className="text-4xl text-foreground-primary uppercase font-bold">Timeline</h1>
        <div className="flex gap-2 justify-end">
          <Input
            type="text"
            placeholder="Search everything..."
            className="bg-white border-primary text-black w-[250px]"
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(e.target.value)}
          />
          <Select onValueChange={(value) => setSelectedDate(value)}>
            <SelectTrigger className="w-[180px] bg-white border-primary text-black">
              <SelectValue placeholder={"Start Date"} />
            </SelectTrigger>
            <SelectContent className="bg-white border-primary">
              <SelectGroup>
                <SelectLabel className="text-gray-400">Dates</SelectLabel>
                {
                  dates.map(date => (
                    <SelectItem 
                      value={date} 
                      key={date.date}
                      className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                    >
                      {date.label}
                    </SelectItem>
                  ))
                }
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setSelectedEndDate(value)}>
            <SelectTrigger className="w-[180px] bg-white border-primary text-black">
              <SelectValue placeholder={"End Date"} />
            </SelectTrigger>
            <SelectContent className="bg-white border-primary">
              <SelectGroup>
                <SelectLabel className="text-gray-400">Dates</SelectLabel>
                {
                  dates.map(date => (
                    <SelectItem 
                      value={date} 
                      key={date.date}
                      className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                    >
                      {date.label}
                    </SelectItem>
                  ))
                }
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setSelectedProject(value)} value={selectedProject}>
            <SelectTrigger className="w-[180px] bg-white border-primary text-black">
              <SelectValue placeholder={"Select Project"} />
            </SelectTrigger>
            <SelectContent className="bg-white border-primary">
              <SelectGroup>
                <SelectLabel className="text-gray-400">Select Project</SelectLabel>
                <SelectItem 
                  value={null}
                  className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                >
                  All
                </SelectItem>
                {
                  user?.Projects.map(project => (
                    <SelectItem 
                      value={project.project_id} 
                      key={project.project_id}
                      className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text"
                    >
                      {project.name}
                    </SelectItem>
                  ))
                }
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-between flex-1 mt-10">
        <h1 className="text-3xl text-foreground-primary uppercase">{selectedDate?.label} Working Hour</h1>
        <div className="flex gap-2 justify-end">
          <Input
            type="text"
            placeholder="Search User by Name"
            className="bg-white border-primary text-black w-[180px]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      </div>

      {
        filterTimes.map(project => (
          <div className='mt-5'>
            <h1 className='text-2xl text-foreground-primary'>{project.name}</h1>

            <div className="flex-1 overflow-auto mt-2">
              <Table className="border-collapse border border-primary rounded-md">
                <TableHeader className="border-b border-primary bg-primary/10">
                  <TableRow>
                    <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-foreground-primary font-semibold">#</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Task</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">User</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">START</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">DESCRIPTION</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Date</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">TOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {
                    project.Time.map((time, index) => (
                      <TableRow key={index}>
                        <TableCell className='border-r border-primary last:border-r-0 text-foreground-secondary'>
                          {index + 1}
                        </TableCell>
                        <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                          {time.task?.name}
                        </TableCell>
                        <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                          {time.user?.name}
                        </TableCell>
                        <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                          {
                            time.status != "PROCESSING" &&
                            <>{moment(time.start).format("h:mm A")} - {moment(time?.end).format("h:mm A")}</>
                          }
                          {
                            time.status == "PROCESSING" &&
                            <>{moment(time.start).format("h:mm A")} - Working...</>
                          }
                        </TableCell>
                        <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                          {time.work_description || "NA"}
                        </TableCell>
                        <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                          {moment(time.created_at).format("DD MMM YYYY")}
                        </TableCell>
                        <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                          {
                            time.status != "PROCESSING" &&
                            <>{getHourMinDiff(time.start, time.end)}</>
                          }
                          {
                            time.status == "PROCESSING" &&
                            <span className='text-green-500'><Timer startTime={time.start} /></span>
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      }

      <div className="flex justify-between flex-1 mt-16">
        <h1 className="text-3xl text-foreground-primary uppercase">{selectedDate?.label} Progress</h1>
        <div className="flex gap-2 justify-end">
          <Input
            type="text"
            placeholder="Search User by Name"
            className="bg-white border-primary text-black w-[180px]"
            value={progressUsername}
            onChange={(e) => setProgressUsername(e.target.value)}
          />

          <Select onValueChange={(value) => setSelectedType(value)}>
            <SelectTrigger className="w-[180px] bg-white border-primary text-black">
              <SelectValue placeholder="Select a Type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-primary">
              <SelectGroup>
                <SelectLabel className="text-gray-400">Type</SelectLabel>
                <SelectItem value={null} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">ALL</SelectItem>
                <SelectItem value={"MAIL"} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">MAIL</SelectItem>
                <SelectItem value={"MEETING"} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">MEETING</SelectItem>
                <SelectItem value={"CHAT"} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">CHAT</SelectItem>
                <SelectItem value={"CALL"} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">CALL</SelectItem>
                <SelectItem value={"COMMENT"} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">COMMENT</SelectItem>
                <SelectItem value={"TRANSCRIBTION"} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">TRANSCRIBTION</SelectItem>
                <SelectItem value={"STATUS_CHANGED"} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">STATUS_CHANGED</SelectItem>
                <SelectItem value={"MEDIA"} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">MEDIA</SelectItem>
                <SelectItem value={"OTHER"} className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">OTHER</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(!filterProgress || filterProgress.length === 0) && (
        <div className="flex items-center justify-center mt-10">
          <h2 className="text-gray-600 text-lg">No progress found for the selected date range</h2>
        </div>
      )}

      {
        filterProgress && filterProgress.length > 0 && filterProgress.map(project => (
          <div className='mt-5' key={project.project_id}>
            <h1 className='text-2xl text-foreground-primary'>{project.name}</h1>

            <div className="flex-1 overflow-auto mt-2">
              <Table className="border-collapse border border-primary rounded-md">
                <TableHeader className="border-b border-primary bg-primary/10">
                  <TableRow>
                    <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-foreground-primary font-semibold">#</TableHead>
                    <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Task Name</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">User Name</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Message</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Type</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {
                    project.Tasks && project.Tasks.map(task => (
                      <React.Fragment key={task.task_id}>
                        {
                          task.Progress && task.Progress.map((progress, index) => (
                            <TableRow key={`${task.task_id}-${progress.progress_id}-${index}`}>
                              <TableCell className='border-r border-primary last:border-r-0 text-foreground-secondary'>
                                {index + 1}
                              </TableCell>
                              <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                                {progress.task?.name}
                              </TableCell>
                              <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                                {progress.user?.name}
                              </TableCell>
                              <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                                {progress?.message}
                              </TableCell>
                              <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                                {progress?.type}
                              </TableCell>
                              <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                                {moment(progress.created_at).format("DD MMM YYYY")}
                              </TableCell>
                            </TableRow>
                          ))
                        }
                      </React.Fragment>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      }

      <div className="flex justify-between flex-1 mt-16">
        <h1 className="text-3xl text-foreground-primary uppercase">{selectedDate?.label} Documents</h1>
      </div>

      {
        filterDocuments && filterDocuments.length > 0 && filterDocuments.map(project => (
          <div className='mt-5' key={project.project_id}>
            <h1 className='text-2xl text-foreground-primary'>{project.name}</h1>

            <div className="flex-1 overflow-auto mt-2">
              <Table className="border-collapse border border-primary rounded-md">
                <TableHeader className="border-b border-primary bg-primary/10">
                  <TableRow>
                    <TableHead className="!w-[80px] border-r border-primary last:border-r-0 text-foreground-primary font-semibold">#</TableHead>
                    <TableHead className="w-[300px] border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Name</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Description</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Date</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Status</TableHead>
                    <TableHead className="border-r border-primary last:border-r-0 text-foreground-primary font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {
                    project.Clients.map(client => (
                      <>
                        {
                          client.Documents.map((document, index) => {
                            // Debug: Log the document data to see available fields
                            
                            return (
                            <TableRow key={index}>
                              <TableCell className='border-r border-primary last:border-r-0 text-foreground-secondary'>
                                {index + 1}
                              </TableCell>
                              <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                                {document.name}
                              </TableCell>
                              <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                                {document.description}
                              </TableCell>
                              <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                                {moment(document.created_at).format("DD MMM YYYY")}
                              </TableCell>
                              <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                                {
                                  user?.Role == "PROVIDER" &&
                                  (
                                    <Select 
                                      onValueChange={(status) => handleUpdateStatus(status, document.document_id)} 
                                      value={document.status} 
                                      className='w-full'
                                    >
                                      <SelectTrigger className="w-full bg-white border-primary text-black">
                                        <SelectValue placeholder="Select a status" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white border-primary">
                                        <SelectGroup>
                                          <SelectLabel className="text-gray-400">Status</SelectLabel>
                                          <SelectItem value="PENDING" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">PENDING</SelectItem>
                                          <SelectItem value="REJECTED" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">REJECTED</SelectItem>
                                          <SelectItem value="APPROVED" className="text-black hover:!bg-tbutton-bg hover:!text-tbutton-text">APPROVED</SelectItem>
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                  )
                                }
                                {
                                  user?.Role == "CLIENT" &&
                                  (
                                    <span>{document.status}</span>
                                  )
                                }
                              </TableCell>
                              <TableCell className="border-r border-primary last:border-r-0 text-foreground-secondary">
                                {
                                  user?.Role == "PROVIDER" &&
                                  (
                                    <>
                                      {
                                        document.filename && document.file_url &&
                                        <div className="flex items-center gap-2">
                                          <a target='__black' href={document.file_url} className='text-primary hover:text-primary/80 underline'>{document.filename}</a>
                                          <button
                                            onClick={() => downloadFile(document.file_url, document.filename)}
                                            className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-300 rounded"
                                          >
                                            Download
                                          </button>
                                        </div>
                                      }
                                      {
                                        !document.filename &&
                                        <span>No Document Uploaded</span>
                                      }
                                    </>
                                  )
                                }
                                {
                                  user?.Role == "CLIENT" &&
                                  (
                                    <div className='flex items-center gap-3'>
                                      {
                                        document.filename && document.file_url &&
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => viewFile(document.file_url, document.filename)}
                                            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded"
                                          >
                                            View
                                          </button>
                                          <button
                                            onClick={() => downloadFile(document.file_url, document.filename)}
                                            className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-300 rounded"
                                          >
                                            Download
                                          </button>
                                        </div>
                                      }
                                      <Input
                                        type="file"
                                        onChange={(e) => hadleUpload(e, document.document_id)}
                                        className="bg-white border-primary text-black"
                                      />
                                    </div>
                                  )
                                }
                              </TableCell>
                            </TableRow>
                            );
                          })
                        }
                      </>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      }
    </div>
  )
}

export default page