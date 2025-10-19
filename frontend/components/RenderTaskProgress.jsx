"use client"
import { taskProgress } from '@/contstant/taskProgressConstant'
import React, { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from './ui/card'
import AvatarCompoment from './AvatarCompoment'
import moment from 'moment'
import { getTaskProgressRequest } from '@/lib/http/task'
import { Download, Eye } from 'lucide-react'

const RenderTaskProgress = ({task_id,date}) => {
  const [progress, setProgress] = useState([]);

  // Utility function to download files with proper filename
  const downloadFile = async (url, filename) => {
    try {
      console.log('Downloading file:', { url, filename });
      
      // Always prioritize the provided filename over URL extraction
      let finalFilename = filename;
      
      // Only extract from URL if no filename is provided at all
      if (!finalFilename && url) {
        const urlParts = url.split('/');
        finalFilename = urlParts[urlParts.length - 1];
        // Remove query parameters if any
        finalFilename = finalFilename.split('?')[0];
      }
      
      console.log('Final filename:', finalFilename);
      
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
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // For download mode, trigger download
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

  // Utility function to view files in new tab with proper filename
  const viewFile = async (url, filename) => {
    try {
      console.log('Viewing file:', { url, filename });
      
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

  const getTaskProgress = useCallback(async () => {
    try {
      const res = await getTaskProgressRequest(task_id,date);
      setProgress(res.data.progresss);
    } catch (error) {
      console.log(error?.response?.data?.meesage || error?.meesage);
    }
  },[date]);


  useEffect(() => {
    getTaskProgress()
  },[date]);
  return (
    <div className='mt-8 p-2 space-y-7'>
        {
          progress.map(progress => {
            // Check if this is a MEDIA type progress entry and has associated media
            let hasAttachment = false;
            let attachmentUrl = null;
            let attachmentName = null;
            
            if (progress.type === 'MEDIA' && progress.task?.Media && progress.task.Media.length > 0) {
              // Find the most recent media that matches the progress message
              const recentMedia = progress.task.Media.find(media => 
                progress.message.includes(media.filename)
              ) || progress.task.Media[0]; // Fallback to first media if no exact match
              
              if (recentMedia) {
                hasAttachment = true;
                attachmentUrl = recentMedia.file_url;
                attachmentName = recentMedia.filename;
              }
            }

            return (
              <Card key={progress.progress_id} className='cursor-pointer border-none shadow-gray-50'>
                <CardContent className='p-3'>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-2'>
                      <AvatarCompoment name={progress.user.name}/>
                      <h3 className='text-gray-700 text-lg'>{progress.user.name}</h3>
                    </div>
                    <time className='font-light text-gray-700 text-sm'>{moment(progress.created_at).format("DD MMM YYYY")}</time>
                  </div>
                  <p className='text-gray-500 leading-5 mt-4 ml-2'>{progress.message}</p>
                  
                  {/* Show download buttons for MEDIA type progress entries */}
                  {hasAttachment && attachmentUrl && (
                    <div className='flex items-center gap-2 mt-3 ml-2'>
                      <button
                        onClick={() => {
                          console.log('View button clicked:', {
                            url: attachmentUrl,
                            filename: attachmentName,
                            progress: progress
                          });
                          viewFile(attachmentUrl, attachmentName);
                        }}
                        className='flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors'
                      >
                        <Eye size={12} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          console.log('Download button clicked:', {
                            url: attachmentUrl,
                            filename: attachmentName,
                            progress: progress
                          });
                          downloadFile(attachmentUrl, attachmentName);
                        }}
                        className='flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors'
                      >
                        <Download size={12} />
                        Download
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        }

        {
          progress && progress.length == 0 &&
          <div className='flex items-center justify-center mt-10'>
            <h2 className='text-gray-600 text-lg'>No Progress on {date}</h2>
          </div>
        }
    </div>
  )
}

export default RenderTaskProgress