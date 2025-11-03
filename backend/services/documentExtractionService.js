import mammoth from 'mammoth';
import JSZip from 'jszip';

/**
 * Document Extraction Service
 * Centralized service for extracting text and HTML from uploaded documents
 * Supports overrides from frontend (current_text_* fields)
 */

// PDF.js lazy loading (same pattern as controller)
let pdfjsPromise = null;
let getPdfjs = null;

async function initPdfjs() {
  if (pdfjsPromise) return pdfjsPromise;
  
  pdfjsPromise = (async () => {
    try {
      // Polyfills for pdfjs (same as controller)
      if (typeof globalThis.DOMMatrix === 'undefined') {
        globalThis.DOMMatrix = class DOMMatrix {
          constructor(init) {
            this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
            this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
            this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
            this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
            if (init) {
              if (typeof init === 'string') {
                const values = init.match(/-?[\d.]+/g);
                if (values && values.length >= 6) {
                  this.m11 = parseFloat(values[0]); this.m12 = parseFloat(values[1]);
                  this.m21 = parseFloat(values[2]); this.m22 = parseFloat(values[3]);
                  this.m41 = parseFloat(values[4]); this.m42 = parseFloat(values[5]);
                }
              } else if (Array.isArray(init)) {
                if (init.length >= 6) {
                  this.m11 = init[0]; this.m12 = init[1];
                  this.m21 = init[2]; this.m22 = init[3];
                  this.m41 = init[4]; this.m42 = init[5];
                }
              }
            }
          }
          static fromMatrix(other) { return new DOMMatrix(other); }
        };
      }
      
      // DOMParser polyfill (optional, only needed for advanced PDF features)
      if (typeof globalThis.DOMParser === 'undefined') {
        globalThis.DOMParser = class DOMParser {
          parseFromString(str, type) {
            // Minimal implementation - pdfjs doesn't require this for basic text extraction
            return null;
          }
        };
      }
      
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      return pdfjs;
    } catch (error) {
      console.error('Failed to load pdfjs:', error);
      throw error;
    }
  })();
  
  return pdfjsPromise;
}

/**
 * Extract text from PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromPdfBuffer(buffer) {
  const pdfjs = await initPdfjs();
  
  // Convert Node Buffer to Uint8Array (pdfjs requirement)
  const data = new Uint8Array(buffer);
  
  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
    useWorkerFetch: false,
    disableFontFace: true
  });
  
  const pdf = await loadingTask.promise;
  let out = '';
  
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent({ includeMarkedContent: false });
    
    const pageText = content.items
      .map(item => (item && item.str ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (pageText) out += pageText + '\n';
  }
  
  return out.trim();
}

/**
 * Extract text from a file based on mimetype
 * @param {Object} file - File object with buffer, mimetype, etc.
 * @returns {Promise<string|null>} Extracted text or null if extraction fails
 */
async function extractTextFromFile(file) {
  try {
    if (!file) {
      throw new Error('File object is undefined');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File buffer is empty');
    }
    
    const mimeType = (file.mimetype || file.type || '').toLowerCase();
    
    // PDF extraction
    if (mimeType.includes('pdf')) {
      try {
        const text = await extractTextFromPdfBuffer(file.buffer);
        if (!text) throw new Error('Empty text from pdfjs');
        return text;
      } catch (e) {
        // Fallback: very rough extraction
        const raw = file.buffer.toString('utf-8');
        const matches = raw.match(/BT\s+.*?ET/gs);
        if (matches?.length) {
          const fallback = matches.join(' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
          if (fallback.length > 10) return fallback;
        }
        throw new Error('All PDF extraction methods failed');
      }
    }
    
    // Word document extraction
    if (mimeType.includes('word') || mimeType.includes('docx') || mimeType.includes('doc')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value || '';
    }
    
    // Plain text extraction
    if (mimeType.includes('text') || mimeType.includes('plain')) {
      return file.buffer.toString('utf-8');
    }
    
    throw new Error(`Unsupported document type: ${mimeType}`);
  } catch (error) {
    console.error('Text extraction error:', error.message);
    return null;
  }
}

/**
 * Extract HTML from a file (for DOCX with styling preservation)
 * @param {Object} file - File object with buffer, mimetype, etc.
 * @returns {Promise<string|null>} Extracted HTML or null if not available
 */
async function extractHtmlFromFile(file) {
  try {
    if (!file || !file.buffer || file.buffer.length === 0) {
      return null;
    }
    
    const mimeType = (file.mimetype || file.type || '').toLowerCase();
    
    // Only DOCX supports HTML extraction
    if (mimeType.includes('word') || mimeType.includes('docx') || mimeType.includes('doc')) {
      const result = await mammoth.convertToHtml({ buffer: file.buffer });
      return result.value || '';
    }
    
    // PDFs and plain text don't have HTML equivalent
    return null;
  } catch (error) {
    console.error('HTML extraction error:', error.message);
    return null;
  }
}

/**
 * Configuration for file size and text length limits
 */
export const extractionLimits = {
  maxFileSize: 10 * 1024 * 1024, // 10MB default
  maxTextLength: 500000, // ~500k characters
  maxTextLengthWarning: 100000, // Warn at 100k characters
};

/**
 * Validate file before extraction
 * @param {Object} file - File object to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'File is required' };
  }
  
  if (!file.buffer || file.buffer.length === 0) {
    return { valid: false, error: 'File buffer is empty' };
  }
  
  if (file.size && file.size > extractionLimits.maxFileSize) {
    return { 
      valid: false, 
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (${extractionLimits.maxFileSize / 1024 / 1024}MB)` 
    };
  }
  
  return { valid: true };
}

/**
 * Extract text and HTML from a file
 * @param {Object} file - File object from multer
 * @param {string} currentTextOverride - Optional text override (from frontend current_text_*)
 * @returns {Promise<{name: string, mimetype: string, size: number, text: string, html: string|null, isCurrentText: boolean}>} Extracted document object
 */
export async function extractDocument(file, currentTextOverride = null) {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Use override text if provided, otherwise extract from file
  let text = currentTextOverride;
  let isCurrentText = false;
  
  if (!text) {
    text = await extractTextFromFile(file);
    if (!text) {
      throw new Error(`Failed to extract text from file: ${file.originalname || 'unknown'}`);
    }
  } else {
    isCurrentText = true;
  }
  
  // Check text length
  if (text.length > extractionLimits.maxTextLength) {
    throw new Error(`Extracted text length (${text.length} characters) exceeds maximum (${extractionLimits.maxTextLength})`);
  }
  
  // Extract HTML only if not using override (HTML comes from original file)
  let html = null;
  if (!isCurrentText) {
    html = await extractHtmlFromFile(file);
  }
  
  return {
    name: file.originalname || file.name || 'unknown',
    mimetype: file.mimetype || file.type || 'application/octet-stream',
    size: file.size || 0,
    text: text,
    html: html,
    isCurrentText: isCurrentText,
    // Keep original file reference for downstream use
    file: file
  };
}

/**
 * Extract multiple documents with current_text overrides support
 * @param {Array<Object>} files - Array of file objects from multer
 * @param {Object} currentTextsMap - Map of filename (lowercase) to current text override
 * @returns {Promise<Array>} Array of extracted document objects
 */
export async function extractDocuments(files = [], currentTextsMap = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }
  
  const extracted = [];
  
  for (const file of files) {
    // Skip undefined or null files
    if (!file) {
      console.error('Skipping undefined file in extractDocuments');
      continue;
    }
    
    try {
      // Find override text if available
      const fileNameLower = (file.originalname || file.name || '').toLowerCase();
      const currentTextOverride = currentTextsMap[fileNameLower] || null;
      
      const doc = await extractDocument(file, currentTextOverride);
      extracted.push(doc);
    } catch (error) {
      console.error(`Failed to extract document ${file?.originalname || file?.name || 'unknown'}:`, error.message);
      // Continue with other files even if one fails
    }
  }
  
  if (extracted.length === 0) {
    throw new Error('Failed to extract text from any uploaded document(s)');
  }
  
  return extracted;
}

/**
 * Parse current_text fields from request body (from frontend FormData)
 * Format: current_text_0, current_text_filename_0, current_text_1, current_text_filename_1, etc.
 * @param {Object} body - Request body object
 * @returns {Object} Map of filename (lowercase) to current text
 */
export function parseCurrentTextMap(body = {}) {
  const currentTextsMap = {};
  const formDataKeys = Object.keys(body);
  
  for (const key of formDataKeys) {
    if (key.startsWith('current_text_') && !key.includes('_filename_')) {
      const index = key.replace('current_text_', '');
      const filenameKey = `current_text_filename_${index}`;
      const filename = body[filenameKey];
      const currentText = body[key];
      
      if (filename && currentText) {
        currentTextsMap[filename.toLowerCase()] = String(currentText);
      }
    }
  }
  
  return currentTextsMap;
}

export default {
  extractDocument,
  extractDocuments,
  extractTextFromFile,
  extractHtmlFromFile,
  validateFile,
  parseCurrentTextMap,
  extractionLimits
};
