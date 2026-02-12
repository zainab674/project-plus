import { updateFileRequest } from '@/lib/http/project';
import { toast } from 'react-toastify';

/**
 * Shared utility function to save/update a document
 * This ensures consistent behavior across all pages that update documents
 * 
 * @param {Object} params - Parameters for saving the document
 * @param {Blob|string} params.content - The document content (Blob for binary files, string for text/HTML)
 * @param {Object} params.editingDocument - The document being edited with metadata
 * @param {Function} params.onSuccess - Optional callback after successful save
 * @param {Function} params.onError - Optional callback after error
 * @param {boolean} params.silent - If true, don't show success toast
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export const saveDocument = async ({
  content,
  editingDocument,
  onSuccess,
  onError,
  silent = false
}) => {
  try {
    // Validate content is not empty
    if (!content || (typeof content === 'string' && content.trim() === '')) {
      toast.error('❌ Document content is empty. Please add some content before saving.');
      return false;
    }

    const formData = new FormData();

    // Determine filename and type
    let filename = editingDocument.filename || editingDocument.name || 'document';
    let type = 'text/html'; // Default

    if (content instanceof Blob) {
      // If content is a Blob (e.g. DOCX), use it directly
      type = content.type || editingDocument.mimeType || 'application/octet-stream';

      // Check if it's a DOCX file
      const isDocx = editingDocument.filename?.toLowerCase().endsWith('.docx') ||
        editingDocument.mimeType?.includes('wordprocessingml') ||
        type.includes('wordprocessingml');

      if (isDocx) {
        // Explicitly set correct MIME type for DOCX
        type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (!filename.endsWith('.docx')) {
          filename += '.docx';
        }
      }
    } else {
      // If content is string (HTML/Text), create a file
      type = editingDocument.mimeType || 'text/html';
      if (!filename.includes('.')) {
        filename += '.html';
      }
    }

    const file = content instanceof Blob
      ? new File([content], filename, { type })
      : new File([content], filename, { type: 'text/html' });

    formData.append('file', file);

    // Add ID based on type (File, Media, or TDocument)
    if (editingDocument.file_id) {
      formData.append('file_id', editingDocument.file_id);
    } else if (editingDocument.media_id) {
      formData.append('media_id', editingDocument.media_id);
    } else if (editingDocument.t_document_id) {
      formData.append('t_document_id', editingDocument.t_document_id);
    }

    const response = await updateFileRequest(formData);

    if (response.data.success) {
      if (!silent) {
        toast.success('✅ Document updated successfully');
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error saving document:', error);
    const errorMessage = error?.response?.data?.message || 'Failed to update document';
    toast.error(errorMessage);
    
    // Call error callback if provided
    if (onError) {
      onError(error);
    }
    
    return false;
  }
};

