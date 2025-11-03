import { callOpenAI, extractMessageContent } from './openaiService.js';
import { detectIntent, selectTargetDocument } from './intentDetectionService.js';
import { buildSchemaPrompt } from './promptBuilderService.js';
import { DocumentAISchema } from '../schema/documentAISchema.js';
import { transformToFrontendFormat, extractOriginalHtml } from '../utils/documentResponseTransformer.js';

/**
 * Document Processor Service
 * Orchestrates the complete document processing workflow:
 * 1. Detects intent
 * 2. Selects target document (if needed)
 * 3. Builds prompts
 * 4. Calls OpenAI
 * 5. Parses and validates response
 * 6. Transforms to frontend format
 */

/**
 * Process documents with AI based on user instruction
 * @param {Object} options - Processing options
 * @param {string} options.instruction - User's instruction/prompt
 * @param {Array<{name: string, mimetype: string, size: number, text: string, html?: string, isCurrentText?: boolean, file?: Object}>} options.documents - Extracted documents
 * @param {string} options.operationType - Operation type: 'instruct' | 'compare' | 'rephrase'
 * @param {string} options.comparisonType - Comparison type (if operationType is 'compare')
 * @param {boolean} options.useSchema - Whether to enforce standardized schema response
 * @returns {Promise<Object>} Processed result in frontend format
 */
export async function processDocuments({
  instruction,
  documents = [],
  operationType = 'instruct',
  comparisonType = 'detailed',
  useSchema = true
}) {
  try {
    // Step 1: Detect intent (for instruct operations)
    let intent = 'analyze';
    let targetDocumentIndex = -1;
    
    // Step 2: Let AI detect intent (it's smart enough to handle this)
    if (operationType === 'instruct') {
      const intentResult = await detectIntent(instruction, documents);
      intent = intentResult.intent;
      targetDocumentIndex = intentResult.targetDocumentIndex ?? -1;
      
      // If AI detected "analyze" with 2+ documents and instruction mentions compare, treat as comparison
      const lowerInstruction = (instruction || '').toLowerCase();
      const mentionsCompare = lowerInstruction.includes('compare') || 
                             lowerInstruction.includes('comparison') ||
                             lowerInstruction.includes('differences') ||
                             lowerInstruction.includes('similarities');
      
      if (intent === 'analyze' && mentionsCompare && documents.length >= 2) {
        // Convert analyze to compare operation for proper handling
        operationType = 'compare';
        intent = 'compare';
        useSchema = false; // Comparisons use regular prompts, not schema
      } else if (intent === 'modify' && targetDocumentIndex === -1 && documents.length > 1) {
        // If modify intent but no target selected, try to select one
        const selectedIndex = await selectTargetDocument(instruction, documents);
        if (selectedIndex !== null) {
          targetDocumentIndex = selectedIndex;
        }
      }
    } else if (operationType === 'compare') {
      intent = 'compare';
      useSchema = false; // Comparisons should never use schema
    } else if (operationType === 'rephrase') {
      intent = 'rephrase';
    }
    
    const lowerInstruction = (instruction || '').toLowerCase();
    
    const isTemplateFilling = lowerInstruction.includes('fill') ||
                              lowerInstruction.includes('populate') ||
                              lowerInstruction.includes('template') ||
                              (targetDocumentIndex >= 0 && documents[targetDocumentIndex]?.name?.toLowerCase().includes('template'));
    
    const wantsTableFormat = lowerInstruction.includes('table') ||
                            lowerInstruction.includes('tabular') ||
                            (lowerInstruction.includes('format') && lowerInstruction.includes('table'));
    
    const isFromPreviousModification = targetDocumentIndex >= 0 &&
                                       documents[targetDocumentIndex]?.isCurrentText === true;
    
    // Determine if this is a comparison operation (used throughout to prevent schema usage)
    const isComparison = intent === 'compare' || operationType === 'compare';
    
    // If it's a comparison, disable schema completely
    if (isComparison) {
      useSchema = false;
    }
    
    // Step 3: Build prompts
    const flags = {
      isFromPreviousModification,
      isTemplateFilling,
      wantsTableFormat
    };
    
    let systemPrompt, userPrompt;
    
    // Don't use schema for analyze/compare operations - they should never modify files
    if (useSchema && operationType === 'instruct' && intent !== 'analyze') {
      // Use schema-based prompts
      const schemaPrompts = buildSchemaPrompt({
        intent,
        instruction,
        documents,
        targetDocumentIndex,
        flags
      });
      systemPrompt = schemaPrompts.systemPrompt;
      userPrompt = schemaPrompts.userPrompt;
    } else {
      // Use regular prompts (for compare/rephrase or when schema not needed)
      const { buildPrompt } = await import('./promptBuilderService.js');
      const prompts = buildPrompt({
        intent,
        instruction,
        documents,
        targetDocumentIndex,
        flags,
        comparisonType
      });
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
    }
    
    // Step 4: Call OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const openAIOptions = {
      messages,
      temperature: 0.3,
      maxTokens: 4096
    };
    
    // Add JSON response format if using schema (and not analyze/compare - they use regular prompts)
    // CRITICAL: Never use schema for comparisons, even if useSchema is true
    if (useSchema && !isComparison && operationType === 'instruct' && intent !== 'analyze') {
      openAIOptions.responseFormat = { type: 'json_object' };
    }
    
    const aiResponse = await callOpenAI(openAIOptions);
    const rawContent = extractMessageContent(aiResponse);
    
    // Step 5: Parse and validate response
    let parsedResponse;
    let finalOutput = '';
    let isModification = false;
    
    // Only use schema parsing if we actually used schema (not for analyze/compare)
    // CRITICAL: Never parse schema for comparisons - they must return plain text tables
    if (useSchema && !isComparison && operationType === 'instruct' && intent !== 'analyze') {
      // Parse and validate schema response
      try {
        parsedResponse = await DocumentAISchema.parseResponse(rawContent);
        
        // Extract output from schema response
        if (parsedResponse.decision?.modify?.length > 0) {
          isModification = true;
          const modifiedFilename = parsedResponse.decision.modify[0];
          const docInfo = parsedResponse.docs?.[modifiedFilename];
          finalOutput = docInfo?.output || parsedResponse.final_answer || '';
        } else if (parsedResponse.decision?.create?.length > 0) {
          const createdFilename = parsedResponse.decision.create[0];
          const docInfo = parsedResponse.docs?.[createdFilename];
          finalOutput = docInfo?.output || parsedResponse.final_answer || '';
        } else {
          finalOutput = parsedResponse.final_answer || rawContent;
        }
      } catch (parseError) {
        console.error('Schema parsing failed, falling back to raw content:', parseError);
        // Fallback: use raw content
        finalOutput = rawContent;
        parsedResponse = null;
      }
    } else {
      // Non-schema response (compare, rephrase, or legacy)
      finalOutput = rawContent;
      parsedResponse = null;
      
      // Detect modification from intent for non-schema responses
      if (intent === 'modify' && targetDocumentIndex >= 0) {
        isModification = true;
      }
    }
    
    // Step 6: Transform to frontend format
    const context = {
      files: documents.map(d => ({
        name: d.name,
        originalname: d.name,
        size: d.size,
        mimetype: d.mimetype,
        extractedText: d.text,
        extractedHtml: d.html
      }))
    };
    
    let frontendResponse;
    
    if (parsedResponse) {
      // Use schema-based transformation
      frontendResponse = transformToFrontendFormat(parsedResponse, context);
    } else {
      // Build legacy format response
      let originalText = null;
      let revisedText = finalOutput;
      
      if (isModification && targetDocumentIndex >= 0) {
        originalText = documents[targetDocumentIndex].text;
      }
      
      // Get original HTML if available
      let originalHtml = null;
      if (isModification && targetDocumentIndex >= 0 && documents[targetDocumentIndex].file) {
        originalHtml = extractOriginalHtml(context, documents[targetDocumentIndex].name);
      }
      
      frontendResponse = {
        success: true,
        message: isModification 
          ? 'Document modification processed successfully'
          : operationType === 'compare'
          ? 'Documents compared successfully'
          : operationType === 'rephrase'
          ? 'Document rephrased successfully'
          : 'Instruction processed successfully',
        files: context.files.map(f => ({
          name: f.name,
          size: f.size,
          type: f.mimetype
        })),
        output_text: finalOutput,
        original_text: originalText,
        revised_text: revisedText,
        modified_file: isModification && targetDocumentIndex >= 0 
          ? documents[targetDocumentIndex].name 
          : undefined,
        is_modification: isModification,
        original_html: originalHtml,
        // Include analysis for compare operations
        analysis: operationType === 'compare' ? finalOutput : undefined
      };
    }
    
    // Add metadata
    frontendResponse.meta = {
      intent,
      targetDocumentIndex: targetDocumentIndex >= 0 ? targetDocumentIndex : null,
      operationType,
      usedSchema: useSchema && operationType === 'instruct',
      parsedResponse: parsedResponse !== null
    };
    
    return frontendResponse;
    
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

/**
 * Process document comparison (specialized for compare operation)
 * @param {string} doc1Name - Name of first document
 * @param {string} doc1Text - Text of first document
 * @param {string} doc2Name - Name of second document
 * @param {string} doc2Text - Text of second document
 * @param {string} comparisonType - Type of comparison
 * @returns {Promise<string>} Comparison result text
 */
export async function processDocumentComparison(doc1Name, doc1Text, doc2Name, doc2Text, comparisonType = 'detailed') {
  const documents = [
    { name: doc1Name, text: doc1Text },
    { name: doc2Name, text: doc2Text }
  ];
  
  const result = await processDocuments({
    instruction: `Compare these two documents in a table format. Provide a detailed markdown table comparing aspects, clauses, and key differences side-by-side.`,
    documents,
    operationType: 'compare',
    comparisonType,
    useSchema: false
  });
  
  return result.analysis || result.output_text || '';
}

export default {
  processDocuments,
  processDocumentComparison
};
