import { DocumentAISchema } from '../schema/documentAISchema.js';

/**
 * Transform standardized AI response to frontend-compatible format
 * This allows gradual migration - backend uses new schema, frontend keeps existing format
 */

/**
 * Transform DocumentAIResponse to frontend format
 * @param {DocumentAIResponse} aiResponse - Standardized AI response
 * @param {Object} context - Additional context (uploaded files, etc.)
 * @returns {Object} Frontend-compatible response
 */
export function transformToFrontendFormat(aiResponse, context = {}) {
  const { files = [] } = context;
  
  // Validate the response first
  const validation = DocumentAISchema.validateResponse(aiResponse);
  if (!validation.valid) {
    console.warn('AI response validation failed:', validation.errors);
    // Still try to transform with best effort
  }
  
  // Determine if this is a modification operation
  const isModification = aiResponse.decision?.modify?.length > 0;
  const isCreation = aiResponse.decision?.create?.length > 0;
  
  // Find the modified file (first one in modify array, or first in create if modifying from existing)
  let modifiedFile = null;
  let originalText = null;
  let revisedText = null;
  let outputText = '';
  
  // Check for modifications first
  if (isModification && aiResponse.decision.modify.length > 0) {
    const modifiedFilename = aiResponse.decision.modify[0];
    const docInfo = aiResponse.docs?.[modifiedFilename];
    
    if (docInfo) {
      modifiedFile = modifiedFilename;
      revisedText = docInfo.output;
      outputText = docInfo.output;
      
      // Log if output is missing or empty
      if (!revisedText || revisedText.trim().length === 0) {
        console.warn(`WARNING: Modified document "${modifiedFilename}" has empty or missing output field in docs.`);
        console.warn('Available doc keys:', Object.keys(aiResponse.docs || {}));
        console.warn('DocInfo keys:', Object.keys(docInfo));
      }
      
      // Try to find original text from context (uploaded files)
      const originalFile = files.find(f => 
        f.name?.toLowerCase() === modifiedFilename.toLowerCase() ||
        f.originalname?.toLowerCase() === modifiedFilename.toLowerCase()
      );
      
      if (originalFile && originalFile.extractedText) {
        originalText = originalFile.extractedText;
      } else {
        console.warn(`WARNING: Could not find original text for "${modifiedFilename}" in uploaded files. Available files:`, files.map(f => f.name || f.originalname));
      }
    } else {
      console.error(`ERROR: Modified filename "${modifiedFilename}" found in decision.modify but missing from docs object.`);
      console.error('Available doc keys:', Object.keys(aiResponse.docs || {}));
    }
  }
  
  // Check for creations
  if (isCreation && aiResponse.decision.create.length > 0 && !isModification) {
    const createdFilename = aiResponse.decision.create[0];
    const docInfo = aiResponse.docs?.[createdFilename];
    
    if (docInfo) {
      outputText = docInfo.output;
      revisedText = docInfo.output;
      // For new documents, there's no original
      originalText = undefined;
    }
  }
  
  // Fallback: use final_answer as output if no specific doc output found
  if (!outputText && aiResponse.final_answer) {
    outputText = aiResponse.final_answer;
  }
  
  // Build files array for response
  const responseFiles = files.map(f => ({
    name: f.name || f.originalname || 'unknown',
    size: f.size || 0,
    type: f.mimetype || f.type || 'application/octet-stream'
  }));
  
  // Build the frontend-compatible response
  const frontendResponse = {
    success: true,
    message: isModification 
      ? 'Document modification processed successfully'
      : isCreation
      ? 'New document created successfully'
      : 'Instruction processed successfully',
    files: responseFiles,
    output_text: outputText,
    original_text: originalText,
    revised_text: revisedText,
    modified_file: modifiedFile,
    is_modification: isModification,
    // Include additional AI response data for future use
    ai_decision: aiResponse.decision,
    ai_docs: aiResponse.docs,
    ai_final_answer: aiResponse.final_answer,
    ai_next_steps: aiResponse.next_steps
  };
  
  return frontendResponse;
}

/**
 * Extract original HTML from context if available
 * @param {Object} context - Context with files
 * @param {string} filename - Filename to match
 * @returns {string|null} Original HTML or null
 */
export function extractOriginalHtml(context, filename) {
  const { files = [] } = context;
  
  const file = files.find(f => 
    (f.name?.toLowerCase() === filename.toLowerCase()) ||
    (f.originalname?.toLowerCase() === filename.toLowerCase())
  );
  
  return file?.extractedHtml || null;
}

export default {
  transformToFrontendFormat,
  extractOriginalHtml
};
