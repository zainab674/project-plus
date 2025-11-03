import { generateSchemaSystemPrompt } from '../schema/documentAISchema.js';
import { truncateText } from './openaiService.js';

/**
 * Prompt Builder Service
 * Centralizes all prompt construction logic for different document operations
 */

/**
 * Build system and user prompts for document operations
 * @param {Object} options - Prompt building options
 * @param {string} options.intent - Intent: 'create' | 'modify' | 'analyze' | 'compare' | 'rephrase'
 * @param {string} options.instruction - User's instruction/prompt
 * @param {Array<{name: string, text: string, isCurrentText?: boolean}>} options.documents - Array of documents
 * @param {number} options.targetDocumentIndex - Index of document to modify (if intent is modify)
 * @param {Object} options.flags - Additional flags
 * @param {boolean} options.flags.isFromPreviousModification - Whether modifying a previously modified doc
 * @param {boolean} options.flags.isTemplateFilling - Whether this is a template filling operation
 * @param {boolean} options.flags.wantsTableFormat - Whether user wants table format response
 * @param {string} options.comparisonType - Comparison type (if intent is compare)
 * @returns {{systemPrompt: string, userPrompt: string}} Built prompts
 */
export function buildPrompt({
  intent,
  instruction,
  documents = [],
  targetDocumentIndex = -1,
  flags = {},
  comparisonType = 'detailed'
}) {
  const {
    isFromPreviousModification = false,
    isTemplateFilling = false,
    wantsTableFormat = false
  } = flags;
  
  let systemPrompt = '';
  let userPrompt = '';
  
  // Build documents section for user prompt
  let docsSection = '';
  if (documents.length > 0) {
    documents.forEach((d, idx) => {
      const truncation = truncateText(d.text, 16000);
      docsSection += `\n\nDocument ${idx + 1}: "${d.name}"\nContent:\n${truncation.text}`;
    });
  }
  
  // Check if instruction contains comparison keywords (even if intent is "analyze")
  const lowerInstruction = (instruction || '').toLowerCase();
  const isComparisonRequest = lowerInstruction.includes('compare') || 
                             lowerInstruction.includes('comparison') ||
                             lowerInstruction.includes('differences') ||
                             lowerInstruction.includes('similarities') ||
                             intent === 'compare';

  // Handle different intents
  switch (intent) {
    case 'compare':
      systemPrompt = buildCompareSystemPrompt(comparisonType);
      userPrompt = buildCompareUserPrompt(documents, comparisonType);
      break;
      
    case 'rephrase':
      systemPrompt = buildRephraseSystemPrompt(instruction);
      userPrompt = `Document Content (truncated if long):\n${documents[0]?.text ? truncateText(documents[0].text, 16000).text : ''}`;
      break;
      
    case 'create':
      systemPrompt = buildCreateSystemPrompt();
      userPrompt = `${instruction}${docsSection}`;
      break;
      
    case 'modify':
      systemPrompt = buildModifySystemPrompt({
        targetDocumentIndex,
        documents,
        instruction,
        isFromPreviousModification,
        isTemplateFilling
      });
      userPrompt = `${instruction}${docsSection}`;
      break;
      
    case 'analyze':
    default:
      // If it's a comparison request (with 2+ documents) and instruction mentions compare, use comparison prompts
      if (isComparisonRequest && documents.length >= 2) {
        systemPrompt = buildCompareSystemPrompt(comparisonType);
        // If user explicitly wants table format, enhance the comparison prompt
        if (wantsTableFormat) {
          systemPrompt += '\n\nCRITICAL: The user specifically requested TABLE FORMAT. You MUST provide the comparison in a markdown table with proper header separator row (|---|---|---|).';
        }
        userPrompt = buildCompareUserPrompt(documents, comparisonType, wantsTableFormat);
      } else if (wantsTableFormat) {
        systemPrompt = buildTableFormatSystemPrompt();
        userPrompt = `${instruction}\n\nIMPORTANT: Respond in proper markdown table format with header separator row (|---|---|---|).${docsSection}`;
      } else {
        systemPrompt = buildAnalyzeSystemPrompt();
        userPrompt = `${instruction}${docsSection}`;
      }
      break;
  }
  
  return { systemPrompt, userPrompt };
}

/**
 * Build system prompt for document comparison
 */
function buildCompareSystemPrompt(comparisonType) {
  return `You are an expert document comparison assistant. Analyze and compare two documents, highlighting similarities, differences, and key changes. 

🚨 CRITICAL REQUIREMENT: You MUST provide the comparison results in a MARKDOWN TABLE FORMAT. The comparison should be organized in a clear table with columns for comparing different aspects of the documents.

Comparison Type: ${comparisonType || 'detailed'}

Your response MUST include a markdown table with the following EXACT structure (including the header separator row):

| Aspect | Document 1 | Document 2 | Differences/Notes |
|--------|------------|------------|-------------------|
| [Aspect Name] | [Value/Content from Doc 1] | [Value/Content from Doc 2] | [Key differences or observations] |

⚠️ IMPORTANT: 
- You MUST include the header separator row (|---|---|---|) after the header row
- Do NOT skip the separator row - it's required for proper markdown table formatting
- Use the EXACT format shown above
- Do NOT provide the comparison in paragraph form, bullet points, or any other format - ONLY table format

Provide comprehensive comparison covering:
- Key sections/clauses
- Terms and conditions
- Dates, amounts, and numbers
- Rights and obligations
- Payment terms
- Termination clauses
- Other relevant provisions

After the table, you may include a brief summary paragraph if needed.`;
}

/**
 * Build user prompt for document comparison
 */
function buildCompareUserPrompt(documents, comparisonType, wantsTableFormat = false) {
  if (documents.length < 2) {
    throw new Error('Comparison requires at least 2 documents');
  }
  
  const doc1Truncation = truncateText(documents[0].text, 16000);
  const doc2Truncation = truncateText(documents[1].text, 16000);
  
  const tableFormatEmphasis = wantsTableFormat 
    ? '\n\n🚨 CRITICAL REQUIREMENT: The user has specifically requested TABLE FORMAT. You MUST respond with a properly formatted markdown table. Include the header separator row (|---|---|---|). Do NOT provide the comparison in any other format.'
    : '';
  
  return `Comparison Type: ${comparisonType || 'detailed'}${tableFormatEmphasis}

Document 1: "${documents[0].name}"
Content:
${doc1Truncation.text}

Document 2: "${documents[1].name}"
Content:
${doc2Truncation.text}

IMPORTANT: Format your comparison as a MARKDOWN TABLE with columns: Aspect | Document 1 | Document 2 | Differences/Notes

Compare the documents section by section, clause by clause, and create a comprehensive table showing:
- Section/clause names
- Content from each document side-by-side
- Key differences, additions, deletions, or variations
- Any important observations

Use this EXACT markdown table format (include the header separator row):
| Aspect | Document 1 | Document 2 | Differences/Notes |
|--------|------------|------------|-------------------|
| [Aspect] | [Content] | [Content] | [Notes] |

Focus on comparing:
- Legal terms and conditions
- Dates, deadlines, and timelines
- Financial terms (rent, deposits, fees)
- Rights and responsibilities
- Termination and renewal clauses
- Dispute resolution procedures
- Any other significant provisions

After the table, add a brief summary if needed.`;
}

/**
 * Build system prompt for rephrase operation
 */
function buildRephraseSystemPrompt(userPrompt) {
  const instruction = userPrompt && String(userPrompt).trim().length > 0
    ? String(userPrompt).trim()
    : 'Rephrase this document for clarity and readability.';
  
  return `You are an expert assistant. STRICTLY follow the user's instruction exactly as provided: "${instruction}". Do exactly what the user asks, without adding your own interpretation or modifying their instructions. Return only the output requested by the user.`;
}

/**
 * Build system prompt for create operation
 */
function buildCreateSystemPrompt() {
  return `You are a document creation assistant. The user wants to CREATE A NEW document based on the provided documents.

IMPORTANT: Your response should be the COMPLETE, FULL TEXT of a NEW document. Do NOT include any explanations, comments, or metadata - only the actual document content.

The new document should:
- Be a complete, standalone document based on the provided source documents
- Follow professional formatting and structure appropriate for the document type
- Incorporate all relevant information from the provided documents as specified in the instruction
- Be ready to use as a new document (not modifying an existing one)

Your output must be ONLY the complete new document text. No preamble, no explanations.`;
}

/**
 * Build system prompt for modify operation
 * Note: When used with schema format, the modified text should go in docs[filename].output field
 */
function buildModifySystemPrompt({
  targetDocumentIndex,
  documents,
  instruction,
  isFromPreviousModification,
  isTemplateFilling
}) {
  if (targetDocumentIndex < 0 || targetDocumentIndex >= documents.length) {
    throw new Error('Invalid target document index');
  }
  
  const targetDoc = documents[targetDocumentIndex];
  const targetDocumentName = targetDoc.name;
  const otherDocs = documents.filter((d, idx) => idx !== targetDocumentIndex);
  
  const dataSourceInfo = otherDocs.length > 0 
    ? `\n\nData sources (use information from these to fill the template):\n${otherDocs.map((d, idx) => `- ${d.name}: Contains relevant data, details, names, dates, and other information that should be extracted and used to fill the template.`).join('\n')}`
    : '';
  
  return `You are an intelligent document modification and template filling assistant. The user wants to MODIFY the existing document "${targetDocumentName}" based on the provided documents.

${isFromPreviousModification 
  ? 'NOTE: The document you are modifying has already been modified in a previous step. You should modify the CURRENT version of the document, not revert to the original.'
  : 'NOTE: You are modifying the original document for the first time.'
}

${isTemplateFilling 
  ? `SPECIAL INSTRUCTION - TEMPLATE FILLING SCENARIO:
This is a template filling operation. The document "${targetDocumentName}" is a template that needs to be filled with data from other documents.
- Identify all placeholder fields, blanks, brackets [], {{}}, or other indicators in the template
- Extract relevant information from the data source documents
- Intelligently map data from source documents to template fields (e.g., names, dates, addresses, amounts, descriptions)
- Preserve the exact structure, format, and wording of the template while filling in the actual values
- If the template has sections/headers, keep them exactly as they are
- Replace placeholders with actual data from the source documents
- Maintain professional formatting and spacing`
  : ''}

IMPORTANT - DOCUMENT MODIFICATION REQUIREMENTS:
You must modify the document "${targetDocumentName}" by creating the COMPLETE, FULL TEXT of the modified version. 

The modified document should:
- ${isFromPreviousModification ? 'Build upon the CURRENT version of the document' : 'Maintain the same structure, format, and template structure as the original'}
- Incorporate all requested changes from the user's instruction
- ${isFromPreviousModification ? 'Apply the new changes to the existing modified content' : 'Intelligently extract and incorporate all relevant information from the other provided documents as specified in the instruction'}
${isTemplateFilling ? '- Map data fields from source documents to appropriate template sections, maintaining template structure' : ''}
- Update dates, names, positions, company details, addresses, amounts, and other specifics as needed from the source documents
- Preserve the professional tone, structure, and formatting
- Include all paragraphs, sections, and content, with the requested modifications applied
${isTemplateFilling ? '- Ensure all template placeholders are filled with actual data from source documents' : ''}

${dataSourceInfo}

CRITICAL: When using the JSON schema format, place the COMPLETE modified document text in the "output" field of docs["${targetDocumentName}"]. The "output" field should contain the full modified text that replaces the original document. Do not include any explanations, comments, or metadata in the output field - only the actual document content.

The modified document text in the "output" field must be ready to replace the current version. No preamble, no explanations, no markdown formatting (unless the original document uses markdown).`;
}

/**
 * Build system prompt for analyze operation
 */
function buildAnalyzeSystemPrompt() {
  return `You are a helpful assistant. STRICTLY follow the user's instructions exactly as provided. Do exactly what the user asks, without adding your own interpretation or modifying their instructions. The user's instruction is the most important directive - follow it precisely, including any specific format requirements like table format, JSON, list format, etc.`;
}

/**
 * Build system prompt for table format responses
 */
function buildTableFormatSystemPrompt() {
  return `You are a helpful assistant. The user has specifically requested a TABLE FORMAT. You MUST respond with a properly formatted markdown table including:
1. Header row with column names
2. Header separator row (|---|---|---|)
3. Data rows

STRICTLY follow the user's instructions exactly. If they ask for "table format", return a proper markdown table with all required markdown table syntax. Do NOT omit the header separator row.`;
}

/**
 * Build prompts using the standardized schema format
 * @param {Object} options - Same as buildPrompt but returns prompts for schema-based responses
 * @returns {{systemPrompt: string, userPrompt: string}} Built prompts with schema enforcement
 */
export function buildSchemaPrompt(options) {
  const { systemPrompt, userPrompt } = buildPrompt(options);
  
  // Wrap the system prompt with schema enforcement
  const schemaEnforcedPrompt = generateSchemaSystemPrompt({
    additionalInstructions: systemPrompt,
    enforceStrictJSON: true
  });
  
  return {
    systemPrompt: schemaEnforcedPrompt,
    userPrompt: userPrompt
  };
}

export default {
  buildPrompt,
  buildSchemaPrompt
};
