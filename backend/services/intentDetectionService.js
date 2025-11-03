import { jsonChatCompletion } from './openaiService.js';
import { truncateText } from './openaiService.js';

/**
 * Intent Detection Service
 * Uses AI to detect user intent: create, modify, or analyze
 * Falls back to keyword-based heuristics if AI fails
 */

/**
 * Detect user intent from instruction and available documents
 * @param {string} instruction - User's instruction/prompt
 * @param {Array<{name: string, text: string}>} documents - Array of document objects with name and text
 * @returns {Promise<{intent: string, targetDocumentIndex: number|null, explanation: string}>} Intent detection result
 */
export async function detectIntent(instruction, documents = []) {
  if (!instruction || typeof instruction !== 'string') {
    return {
      intent: 'analyze',
      targetDocumentIndex: null,
      explanation: 'No instruction provided'
    };
  }
  
  // If no documents, default to analyze (unless explicitly creating)
  if (!documents || documents.length === 0) {
    const lowerInstruction = instruction.toLowerCase();
    if (lowerInstruction.includes('create') || 
        lowerInstruction.includes('generate') ||
        lowerInstruction.includes('make a new')) {
      return {
        intent: 'create',
        targetDocumentIndex: null,
        explanation: 'User wants to create a new document'
      };
    }
    return {
      intent: 'analyze',
      targetDocumentIndex: null,
      explanation: 'No documents provided, defaulting to analyze'
    };
  }
  
  // Single document scenario - simpler logic
  if (documents.length === 1) {
    const lowerInstruction = instruction.toLowerCase();
    const wantsToCreate = lowerInstruction.includes('create') || 
                          lowerInstruction.includes('generate') ||
                          lowerInstruction.includes('make a new') ||
                          lowerInstruction.includes('new document');
    
    const wantsToModify = (lowerInstruction.includes('modify') || 
                          lowerInstruction.includes('edit') ||
                          lowerInstruction.includes('update') ||
                          lowerInstruction.includes('change') ||
                          lowerInstruction.includes('adapt') ||
                          lowerInstruction.includes('fill') ||
                          lowerInstruction.includes('populate') ||
                          lowerInstruction.includes('complete')) &&
                          !wantsToCreate;
    
    if (wantsToModify) {
      return {
        intent: 'modify',
        targetDocumentIndex: 0,
        explanation: 'Single document modification detected via keywords'
      };
    }
    
    if (wantsToCreate) {
      return {
        intent: 'create',
        targetDocumentIndex: null,
        explanation: 'User wants to create new document'
      };
    }
    
    // Default to modify for single document (user likely wants to modify it)
    return {
      intent: 'modify',
      targetDocumentIndex: 0,
      explanation: 'Single document provided, defaulting to modify'
    };
  }
  
  // Check for compare intent first (should never modify for compare requests)
  const lowerInstruction = instruction.toLowerCase();
  const wantsToCompare = lowerInstruction.includes('compare') || 
                         lowerInstruction.includes('comparison') ||
                         lowerInstruction.includes('differences') ||
                         lowerInstruction.includes('similarities');
  
  if (wantsToCompare && documents.length >= 2) {
    return {
      intent: 'analyze',
      targetDocumentIndex: null,
      explanation: 'Compare operation detected - analyzing without modification'
    };
  }
  
  // Multiple documents - use AI detection
  try {
    const intentResult = await detectIntentWithAI(instruction, documents);
    return intentResult;
  } catch (error) {
    console.error('AI intent detection failed, falling back to keywords:', error);
    return detectIntentWithKeywords(instruction, documents);
  }
}

/**
 * Use AI to detect intent (primary method)
 * @param {string} instruction - User instruction
 * @param {Array<{name: string, text: string}>} documents - Available documents
 * @returns {Promise<{intent: string, targetDocumentIndex: number|null, explanation: string}>} Intent result
 */
async function detectIntentWithAI(instruction, documents) {
  // Build document preview list
  const fileList = documents.map((d, idx) => {
    const preview = truncateText(d.text, 800).text.replace(/\n/g, ' ').trim();
    const docType = d.name.toLowerCase().includes('template') ? 'Template' :
                    d.name.toLowerCase().includes('report') ? 'Report' :
                    d.name.toLowerCase().includes('agreement') ? 'Agreement' :
                    d.name.toLowerCase().includes('lease') ? 'Lease' :
                    'Document';
    
    return `${idx + 1}. "${d.name}"\n   Type: ${docType}\n   Preview: ${preview}${d.text.length > 800 ? '...' : ''}`;
  }).join('\n\n');
  
  const systemPrompt = `You are an intelligent intent detection assistant. Analyze user instructions and determine their intent.

Available documents:
${fileList}

Determine the user's intent. Respond with a JSON object in this exact format:
{
  "intent": "modify" | "create" | "analyze",
  "targetDocumentIndex": number (1-based) or null,
  "explanation": "brief explanation"
}

🚨 CRITICAL RULES - READ CAREFULLY:

1. COMPARISON DETECTION (HIGHEST PRIORITY):
   If the instruction contains ANY of these words: "compare", "comparison", "differences", "similarities", "compare these", "show differences", "what are the differences"
   AND there are 2 or more documents provided
   THEN intent MUST be "analyze" (NOT "modify", NOT "create")
   
   Examples that MUST be "analyze":
   - "compare these" → analyze
   - "compare these documents" → analyze  
   - "show me the differences" → analyze
   - "what are the similarities" → analyze
   - "compare Offer Letter.docx and NVCA-VA.docx" → analyze

2. INTENT MEANINGS:
   - "analyze": User wants to VIEW, COMPARE, ANALYZE, SUMMARIZE, or SHOW INFORMATION WITHOUT modifying any documents. This includes:
     * All comparison requests ("compare these", "show differences")
     * Summarization ("summarize these documents")
     * Information extraction ("extract key points from these documents")
     * Analysis requests ("analyze these documents")
     * Any read-only operation that doesn't change documents
     
   - "modify": User explicitly wants to CHANGE, EDIT, UPDATE, FILL, or POPULATE an existing document. This includes:
     * "Fill template X with data from Y"
     * "Update document X with information from Y"
     * "Modify document X based on Y"
     * "Populate form X with data from Y"
     * Only use "modify" if the user EXPLICITLY wants to change/write to a document
     
   - "create": User explicitly wants to CREATE A BRAND NEW document using phrases like:
     * "create new document"
     * "generate new file"
     * "make a new document"
     * Only use if creating something entirely new

3. WHEN MULTIPLE DOCUMENTS ARE PROVIDED:
   - If instruction contains "compare" or "differences/similarities" → ALWAYS "analyze"
   - If instruction explicitly says "modify X", "update X", "fill X" → "modify"
   - If instruction says "create" or "generate new" → "create"
   - Default to "analyze" when unclear (safer to not modify)

4. If intent is "modify", identify which document should be modified (targetDocumentIndex, 1-based). For template filling, the template should be the target.

Respond with ONLY the JSON object, nothing else.`;
  
  const userPrompt = `Analyze the user's instruction and determine their intent. The user said: "${instruction}"`;
  
  try {
    const intentData = await jsonChatCompletion(
      systemPrompt,
      userPrompt,
      {
        temperature: 0.1,
        maxTokens: 200
      }
    );
    
    // Validate and normalize the response
    if (!intentData || typeof intentData !== 'object') {
      throw new Error('Invalid AI response format');
    }
    
    const intent = intentData.intent?.toLowerCase();
    if (!['modify', 'create', 'analyze'].includes(intent)) {
      throw new Error(`Invalid intent: ${intent}`);
    }
    
    let targetDocumentIndex = null;
    if (intentData.targetDocumentIndex !== null && intentData.targetDocumentIndex !== undefined) {
      const docNumber = parseInt(intentData.targetDocumentIndex);
      if (docNumber >= 1 && docNumber <= documents.length) {
        targetDocumentIndex = docNumber - 1; // Convert to 0-based
      }
    }
    
    return {
      intent,
      targetDocumentIndex,
      explanation: intentData.explanation || 'AI detected intent'
    };
  } catch (error) {
    console.error('AI intent detection error:', error);
    throw error;
  }
}

/**
 * Fallback keyword-based intent detection
 * @param {string} instruction - User instruction
 * @param {Array<{name: string, text: string}>} documents - Available documents
 * @returns {{intent: string, targetDocumentIndex: number|null, explanation: string}} Intent result
 */
function detectIntentWithKeywords(instruction, documents) {
  const lowerInstruction = instruction.toLowerCase();
  
  // Check for compare/analyze intent first (should never modify)
  const wantsToCompare = lowerInstruction.includes('compare') ||
                         lowerInstruction.includes('comparison') ||
                         lowerInstruction.includes('differences') ||
                         lowerInstruction.includes('similarities');
  
  const wantsToAnalyze = lowerInstruction.includes('analyze') ||
                         lowerInstruction.includes('summarize') ||
                         lowerInstruction.includes('extract information') ||
                         lowerInstruction.includes('what are');
  
  if ((wantsToCompare || wantsToAnalyze) && !lowerInstruction.includes('modify') && 
      !lowerInstruction.includes('edit') && !lowerInstruction.includes('update') &&
      !lowerInstruction.includes('change') && !lowerInstruction.includes('fill') &&
      !lowerInstruction.includes('populate')) {
    return {
      intent: 'analyze',
      targetDocumentIndex: null,
      explanation: 'Compare/analyze intent detected via keywords - no modification'
    };
  }
  
  // Check for create intent (stronger signal)
  const wantsToCreate = lowerInstruction.includes('create') ||
                        lowerInstruction.includes('generate') ||
                        lowerInstruction.includes('make a new') ||
                        lowerInstruction.includes('new document') ||
                        lowerInstruction.includes('new file');
  
  if (wantsToCreate) {
    return {
      intent: 'create',
      targetDocumentIndex: null,
      explanation: 'Create intent detected via keywords'
    };
  }
  
  // Check for modify intent
  const wantsToModify = lowerInstruction.includes('modify') ||
                        lowerInstruction.includes('edit') ||
                        lowerInstruction.includes('update') ||
                        lowerInstruction.includes('change') ||
                        lowerInstruction.includes('adapt') ||
                        lowerInstruction.includes('fill') ||
                        lowerInstruction.includes('populate') ||
                        lowerInstruction.includes('complete');
  
  if (wantsToModify) {
    // For keyword-based detection, default to first document
    // In practice, this might need user confirmation in UI
    return {
      intent: 'modify',
      targetDocumentIndex: documents.length === 1 ? 0 : null, // Only auto-select if single doc
      explanation: 'Modify intent detected via keywords' + 
                   (documents.length > 1 ? ' (multiple docs - may need user confirmation)' : '')
    };
  }
  
  // Default to analyze
  return {
    intent: 'analyze',
    targetDocumentIndex: null,
    explanation: 'No clear intent detected, defaulting to analyze'
  };
}

/**
 * Select target document when multiple documents are present and intent is modify
 * @param {string} instruction - User instruction
 * @param {Array<{name: string, text: string}>} documents - Available documents
 * @returns {Promise<number|null>} Selected document index (0-based) or null if cannot determine
 */
export async function selectTargetDocument(instruction, documents) {
  if (!documents || documents.length <= 1) {
    return documents.length === 1 ? 0 : null;
  }
  
  try {
    // Use AI to select the target document
    const fileList = documents.map((d, idx) => {
      const preview = truncateText(d.text, 500).text.replace(/\n/g, ' ').trim();
      return `${idx + 1}. "${d.name}"\n   Preview: ${preview}${d.text.length > 500 ? '...' : ''}`;
    }).join('\n\n');
    
    const systemPrompt = `You are a document selection assistant. Analyze the user instruction and available documents, then respond with ONLY the document number (1, 2, 3, etc.) that should be modified. Respond with just the number, nothing else.`;
    
    const userPrompt = `The user wants to modify a document. Based on their instruction: "${instruction}"

Available documents:
${fileList}

Which document should be modified? Analyze the instruction carefully and identify which document matches what the user wants to modify. Respond with ONLY the document number (1, 2, 3, etc.) and nothing else.`;
    
    const response = await jsonChatCompletion(
      systemPrompt,
      userPrompt,
      {
        temperature: 0.1,
        maxTokens: 10
      }
    );
    
    // Try to extract number from response
    const responseText = JSON.stringify(response);
    const docNumberMatch = responseText.match(/\d+/);
    
    if (docNumberMatch) {
      const docNumber = parseInt(docNumberMatch[0]);
      if (docNumber >= 1 && docNumber <= documents.length) {
        return docNumber - 1; // Convert to 0-based
      }
    }
    
    return null;
  } catch (error) {
    console.error('Target document selection failed:', error);
    return null;
  }
}

export default {
  detectIntent,
  selectTargetDocument
};
