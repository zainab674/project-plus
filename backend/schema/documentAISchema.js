/**
 * Document AI Response Schema
 * Standardized JSON schema that the LLM must return for all document operations
 */

/**
 * Decision structure - indicates what action to take
 * @typedef {Object} DecisionStructure
 * @property {string[]} create - Array of filenames to create as new documents
 * @property {string[]} modify - Array of filenames to modify
 * @property {string[]} none - Array of filenames to leave untouched
 */

/**
 * Document change information
 * @typedef {Object} DocChangeInfo
 * @property {string} reason - Explanation of why this document is being changed
 * @property {string} change_type - Type of change: "create" | "overwrite" | "patch" | "append"
 * @property {string} original_name - Original filename
 * @property {string} modified_name - New/modified filename (may be same as original_name)
 * @property {string} output - The actual content or patch (full modified text or unified-diff)
 * @property {string[]} changelog - Array of change descriptions
 */

/**
 * Complete AI response structure
 * @typedef {Object} DocumentAIResponse
 * @property {DecisionStructure} decision - Decision about what to create/modify/leave
 * @property {Object<string, DocChangeInfo>} docs - Object mapping filename to change info
 * @property {string} final_answer - Human-readable summary (2-6 sentences)
 * @property {string[]} next_steps - Array of instructions for user/frontend
 */

/**
 * Schema validation and parsing utilities
 */
export const DocumentAISchema = {
  /**
   * Validate decision structure
   * @param {any} decision - Decision object to validate
   * @returns {boolean} True if valid
   */
  validateDecision(decision) {
    if (!decision || typeof decision !== 'object') {
      return false;
    }
    
    const validKeys = ['create', 'modify', 'none'];
    const hasValidKeys = Object.keys(decision).every(key => validKeys.includes(key));
    
    if (!hasValidKeys) {
      return false;
    }
    
    // Each value should be an array of strings
    for (const key of validKeys) {
      if (decision[key] !== undefined) {
        if (!Array.isArray(decision[key])) {
          return false;
        }
        if (!decision[key].every(item => typeof item === 'string')) {
          return false;
        }
      }
    }
    
    return true;
  },

  /**
   * Validate doc change info
   * @param {any} docInfo - Doc change info to validate
   * @returns {boolean} True if valid
   */
  validateDocChangeInfo(docInfo) {
    if (!docInfo || typeof docInfo !== 'object') {
      return false;
    }
    
    const requiredFields = ['reason', 'change_type', 'original_name', 'modified_name', 'output'];
    const hasAllFields = requiredFields.every(field => docInfo[field] !== undefined);
    
    if (!hasAllFields) {
      return false;
    }
    
    // Validate change_type enum
    const validChangeTypes = ['create', 'overwrite', 'patch', 'append'];
    if (!validChangeTypes.includes(docInfo.change_type)) {
      return false;
    }
    
    // Validate types
    if (typeof docInfo.reason !== 'string' ||
        typeof docInfo.change_type !== 'string' ||
        typeof docInfo.original_name !== 'string' ||
        typeof docInfo.modified_name !== 'string' ||
        typeof docInfo.output !== 'string') {
      return false;
    }
    
    // changelog is optional but if present should be array of strings
    if (docInfo.changelog !== undefined) {
      if (!Array.isArray(docInfo.changelog)) {
        return false;
      }
      if (!docInfo.changelog.every(item => typeof item === 'string')) {
        return false;
      }
    }
    
    return true;
  },

  /**
   * Validate complete AI response
   * @param {any} response - Response object to validate
   * @returns {{valid: boolean, errors: string[]}} Validation result
   */
  validateResponse(response) {
    const errors = [];
    
    if (!response || typeof response !== 'object') {
      errors.push('Response must be an object');
      return { valid: false, errors };
    }
    
    // Validate decision
    if (!response.decision) {
      errors.push('Missing required field: decision');
    } else if (!this.validateDecision(response.decision)) {
      errors.push('Invalid decision structure');
    }
    
    // Validate docs (optional but if present must be valid)
    if (response.docs !== undefined) {
      if (typeof response.docs !== 'object') {
        errors.push('docs must be an object');
      } else {
        for (const [filename, docInfo] of Object.entries(response.docs)) {
          if (!this.validateDocChangeInfo(docInfo)) {
            errors.push(`Invalid doc info for "${filename}"`);
          }
        }
      }
    }
    
    // Validate final_answer (required)
    if (!response.final_answer) {
      errors.push('Missing required field: final_answer');
    } else if (typeof response.final_answer !== 'string') {
      errors.push('final_answer must be a string');
    }
    
    // Validate next_steps (optional but if present must be array of strings)
    if (response.next_steps !== undefined) {
      if (!Array.isArray(response.next_steps)) {
        errors.push('next_steps must be an array');
      } else if (!response.next_steps.every(item => typeof item === 'string')) {
        errors.push('next_steps must be an array of strings');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Parse and validate AI response (with lenient parsing for markdown/code blocks)
   * @param {string} rawResponse - Raw response string from LLM
   * @returns {Promise<DocumentAIResponse>} Parsed and validated response
   * @throws {Error} If parsing/validation fails
   */
  async parseResponse(rawResponse) {
    if (!rawResponse || typeof rawResponse !== 'string') {
      throw new Error('Response must be a non-empty string');
    }
    
    let parsed;
    const trimmed = rawResponse.trim();
    
    // Try direct JSON parse first (most common with json_object response format)
    try {
      parsed = JSON.parse(trimmed);
    } catch (firstError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/s);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsed = JSON.parse(jsonMatch[1].trim());
        } catch {
          // Try nested matching - sometimes the JSON is malformed in code blocks
          const innerMatch = jsonMatch[1].match(/\{[\s\S]*\}/);
          if (innerMatch) {
            try {
              parsed = JSON.parse(innerMatch[0]);
            } catch {
              throw new Error(`Failed to parse JSON from code block: ${firstError.message}`);
            }
          } else {
            throw new Error('Failed to parse JSON from code block: no valid JSON found');
          }
        }
      } else {
        // Try to find any JSON object in the response (look for balanced braces)
        let braceCount = 0;
        let startIndex = -1;
        let endIndex = -1;
        
        for (let i = 0; i < trimmed.length; i++) {
          if (trimmed[i] === '{') {
            if (startIndex === -1) startIndex = i;
            braceCount++;
          } else if (trimmed[i] === '}') {
            braceCount--;
            if (braceCount === 0 && startIndex !== -1) {
              endIndex = i;
              break;
            }
          }
        }
        
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const jsonCandidate = trimmed.substring(startIndex, endIndex + 1);
          try {
            parsed = JSON.parse(jsonCandidate);
          } catch (parseError) {
            // Log the problematic JSON for debugging
            console.error('Failed to parse extracted JSON:', {
              snippet: jsonCandidate.substring(0, 200),
              error: parseError.message
            });
            throw new Error(`Failed to extract valid JSON from response: ${parseError.message}. Response preview: ${trimmed.substring(0, 300)}`);
          }
        } else {
          // Log what we received for debugging
          console.error('No JSON found in response. Response preview:', trimmed.substring(0, 500));
          throw new Error(`No JSON found in response. Response preview: ${trimmed.substring(0, 200)}`);
        }
      }
    }
    
    // Validate the parsed response
    const validation = this.validateResponse(parsed);
    if (!validation.valid) {
      throw new Error(`Invalid response schema: ${validation.errors.join(', ')}`);
    }
    
    return parsed;
  },

  /**
   * Create a minimal valid response structure (for defaults/fallbacks)
   * @param {Object} options - Options to customize the response
   * @returns {DocumentAIResponse} Minimal valid response
   */
  createMinimalResponse(options = {}) {
    const {
      decision = { create: [], modify: [], none: [] },
      docs = {},
      final_answer = 'Processing complete.',
      next_steps = []
    } = options;
    
    return {
      decision: {
        create: Array.isArray(decision.create) ? decision.create : [],
        modify: Array.isArray(decision.modify) ? decision.modify : [],
        none: Array.isArray(decision.none) ? decision.none : []
      },
      docs: typeof docs === 'object' ? docs : {},
      final_answer: typeof final_answer === 'string' ? final_answer : 'Processing complete.',
      next_steps: Array.isArray(next_steps) ? next_steps : []
    };
  }
};

/**
 * Generate system prompt that enforces the schema
 * @param {Object} options - Additional instructions to include
 * @returns {string} System prompt
 */
export function generateSchemaSystemPrompt(options = {}) {
  const {
    additionalInstructions = '',
    enforceStrictJSON = true
  } = options;
  
  const strictJSONNote = enforceStrictJSON
    ? '\n\nCRITICAL: You MUST respond with ONLY valid JSON in the exact format specified above. No markdown, no code blocks, no commentary. Just the raw JSON object.'
    : '\n\nReturn your response as a valid JSON object in the format specified above. You may wrap it in markdown code blocks if needed.';
  
  return `You are an intelligent document processing assistant. You analyze user instructions and documents, then decide what actions to take.

You MUST respond with a JSON object in this EXACT format:

{
  "decision": {
    "create": ["filename1.docx", "filename2.docx"],  // Array of filenames to create as new documents
    "modify": ["TemplateA.docx"],                     // Array of filenames to modify
    "none": ["Notes.txt"]                             // Array of filenames to leave untouched
  },
  "docs": {
    "TemplateA.docx": {
      "reason": "User requested to fill tenant name and dates from LeaseData.docx",
      "change_type": "patch",                         // One of: "create", "overwrite", "patch", "append"
      "original_name": "TemplateA.docx",
      "modified_name": "TemplateA_filled.docx",      // May be same as original_name
      "output": "<COMPLETE FULL TEXT of the modified document here - this should be the ENTIRE document content with all changes applied>",  // REQUIRED: The complete modified document text
      "changelog": [                                  // Optional array of change descriptions
        "Filled placeholders: {{TENANT_NAME}}, {{START_DATE}}",
        "Standardized date format to YYYY-MM-DD"
      ]
    }
  },
  "final_answer": "Short human summary: e.g., Created 1 new file (NewLease_Tenant.docx). Modified TemplateA.docx with tenant details. See docs.TemplateA.docx.output for full content.",
  "next_steps": [
    "Review changes in UI and accept to generate .docx",
    "If OK, click 'Export .docx with track changes'"
  ]
}

${additionalInstructions ? `\n\nAdditional Instructions:\n${additionalInstructions}` : ''}

${strictJSONNote}`;
}

/**
 * Type definitions for better IDE support (JSDoc)
 */
export default {
  DocumentAISchema,
  generateSchemaSystemPrompt
};
