import { callOpenAI, extractMessageContent, estimateTokens } from './openaiService.js';
import { detectIntent, selectTargetDocument } from './intentDetectionService.js';
import { buildSchemaPrompt } from './promptBuilderService.js';
import { DocumentAISchema } from '../schema/documentAISchema.js';
import { transformToFrontendFormat, extractOriginalHtml } from '../utils/documentResponseTransformer.js';
import { getModelConfig } from '../config/openaiConfig.js';

/**
 * Document Processor Service
 * Orchestrates the complete document processing workflow:
 * 1. Detects intent
 * 2. Selects target document (if needed)
 * 3. Builds prompts
 * 4. Calls OpenAI (with batching for large documents)
 * 5. Parses and validates response
 * 6. Transforms to frontend format
 */

/**
 * Split text into chunks based on token estimates
 * @param {string} text - Text to split
 * @param {number} maxTokensPerChunk - Maximum tokens per chunk
 * @param {number} overlapTokens - Overlap tokens between chunks (for context continuity)
 * @returns {Array<{text: string, startIndex: number, endIndex: number}>} Array of text chunks
 */
function splitTextIntoChunks(text, maxTokensPerChunk = 3000, overlapTokens = 200) {
  if (!text || text.length === 0) {
    return [];
  }
  
  const chunks = [];
  const maxCharsPerChunk = maxTokensPerChunk * 4; // 4 chars ≈ 1 token
  const overlapChars = overlapTokens * 4;
  
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + maxCharsPerChunk, text.length);
    
    // Try to break at a sentence boundary if possible
    if (endIndex < text.length) {
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      // Use break point if it's within reasonable distance (at least 80% of max)
      if (breakPoint > startIndex + (maxCharsPerChunk * 0.8)) {
        endIndex = breakPoint + 1;
      }
    }
    
    const chunk = text.substring(startIndex, endIndex);
    chunks.push({
      text: chunk,
      startIndex,
      endIndex
    });
    
    // Move start index with overlap for next chunk
    startIndex = Math.max(startIndex + 1, endIndex - overlapChars);
    
    // Prevent infinite loop
    if (startIndex >= endIndex) {
      startIndex = endIndex;
    }
  }
  
  return chunks;
}

/**
 * Process documents in batches when output is expected to exceed token limits
 * @param {Object} options - Processing options
 * @param {Array} options.messages - Initial messages array
 * @param {string} options.targetDocumentText - Full text of document being processed
 * @param {string} options.instruction - User instruction
 * @param {boolean} options.useSchema - Whether to use schema format
 * @param {number} options.maxCompletionTokens - Maximum completion tokens per call
 * @returns {Promise<string>} Complete processed document text
 */
async function processDocumentsInBatches({
  messages,
  targetDocumentText,
  instruction,
  useSchema,
  maxCompletionTokens = 4096
}) {
  // Estimate if output will exceed token limit
  // Rough estimate: output is typically 1.2-1.5x input for modifications
  const estimatedOutputTokens = estimateTokens(targetDocumentText) * 1.3;
  const chunkSize = Math.floor(maxCompletionTokens * 0.8); // Use 80% of limit for safety
  
  // If estimated output is within limit, process normally
  if (estimatedOutputTokens <= maxCompletionTokens) {
    const response = await callOpenAI({
      messages,
      temperature: 0.3,
      maxTokens: maxCompletionTokens,
      responseFormat: useSchema ? { type: 'json_object' } : null
    });
    const content = extractMessageContent(response);
    
    if (useSchema) {
      const parsed = await DocumentAISchema.parseResponse(content);
      const modifiedFilename = parsed.decision?.modify?.[0] || parsed.decision?.create?.[0];
      return parsed.docs?.[modifiedFilename]?.output || parsed.final_answer || content;
    }
    return content;
  }
  
  // Split document into chunks
  const chunks = splitTextIntoChunks(targetDocumentText, chunkSize, 200);
  console.log(`Processing document in ${chunks.length} batches due to size`);
  
  const accumulatedOutputs = [];
  let conversationHistory = [...messages];
  
  // Process each chunk sequentially
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isFirstChunk = i === 0;
    const isLastChunk = i === chunks.length - 1;
    
    // Build chunk-specific prompt
    let chunkPrompt = '';
    if (isFirstChunk) {
      chunkPrompt = `I'm processing a large document in batches. This is CHUNK 1 of ${chunks.length}.

${instruction}

Here is the first part of the document:

${chunk.text}

Please process this chunk according to the instruction. Return the processed content for this chunk only.`;
    } else if (isLastChunk) {
      chunkPrompt = `This is CHUNK ${i + 1} of ${chunks.length} (FINAL CHUNK).

Here is the final part of the document:

${chunk.text}

Please process this final chunk and return the complete processed content. Make sure to maintain consistency with the previous chunks.`;
    } else {
      chunkPrompt = `This is CHUNK ${i + 1} of ${chunks.length}.

Here is the next part of the document:

${chunk.text}

Please process this chunk and return the processed content for this chunk only. Maintain consistency with previous chunks.`;
    }
    
    // Add chunk to conversation
    conversationHistory.push({
      role: 'user',
      content: chunkPrompt
    });
    
    // Call OpenAI for this chunk
    const chunkResponse = await callOpenAI({
      messages: conversationHistory,
      temperature: 0.3,
      maxTokens: maxCompletionTokens,
      responseFormat: useSchema ? { type: 'json_object' } : null
    });
    
    const chunkContent = extractMessageContent(chunkResponse);
    
    // Extract output from response
    let chunkOutput = '';
    if (useSchema) {
      try {
        const parsed = await DocumentAISchema.parseResponse(chunkContent);
        const modifiedFilename = parsed.decision?.modify?.[0] || parsed.decision?.create?.[0];
        chunkOutput = parsed.docs?.[modifiedFilename]?.output || parsed.final_answer || chunkContent;
      } catch (parseError) {
        console.warn(`Failed to parse chunk ${i + 1} response, using raw content:`, parseError.message);
        chunkOutput = chunkContent;
      }
    } else {
      chunkOutput = chunkContent;
    }
    
    // Add AI response to conversation history for context
    conversationHistory.push({
      role: 'assistant',
      content: chunkOutput
    });
    
    accumulatedOutputs.push(chunkOutput);
    
    // Small delay between chunks to avoid rate limits
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // If we have multiple chunks, combine them with a final pass to ensure consistency
  if (chunks.length > 1) {
    console.log('Combining chunks and generating final response...');
    
    const combinedOutput = accumulatedOutputs.join('\n\n');
    
    // Final pass: ask AI to combine and refine the full document
    let finalPrompt = '';
    if (useSchema) {
      finalPrompt = `I've processed a large document in ${chunks.length} batches. Here is the combined output from all chunks:

${combinedOutput}

Please review and combine these chunks into a single, coherent, complete document. Return your response in the required JSON schema format with:
- decision.modify or decision.create containing the filename
- docs object with the complete processed document in the "output" field
- final_answer summarizing what was done
- Ensure all sections flow smoothly together, no duplicates, and complete formatting

Return the final, complete processed document in the JSON schema format.`;
    } else {
      finalPrompt = `I've processed a large document in ${chunks.length} batches. Here is the combined output:

${combinedOutput}

Please review and combine these chunks into a single, coherent, complete document. Ensure:
1. All sections flow smoothly together
2. No duplicate content
3. Complete and consistent formatting
4. All parts of the original instruction are addressed

Return the final, complete processed document.`;
    }
    
    conversationHistory.push({
      role: 'user',
      content: finalPrompt
    });
    
    const finalResponse = await callOpenAI({
      messages: conversationHistory,
      temperature: 0.3,
      maxTokens: maxCompletionTokens,
      responseFormat: useSchema ? { type: 'json_object' } : null
    });
    
    const finalContent = extractMessageContent(finalResponse);
    
    if (useSchema) {
      try {
        const parsed = await DocumentAISchema.parseResponse(finalContent);
        const modifiedFilename = parsed.decision?.modify?.[0] || parsed.decision?.create?.[0];
        return parsed.docs?.[modifiedFilename]?.output || parsed.final_answer || finalContent;
      } catch (parseError) {
        console.warn('Failed to parse final combined response, using raw content:', parseError.message);
        return finalContent;
      }
    }
    
    return finalContent;
  }
  
  return accumulatedOutputs[0] || '';
}

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
    
    // Step 4: Call OpenAI (with batching for large documents)
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    // Get model config to determine appropriate maxTokens for document generation
    // Note: Most OpenAI models have a 4096 completion token limit, regardless of context window size
    const modelConfig = getModelConfig();
    // Use the model's maxCompletionTokens (typically 4096) or fallback to 4096
    // The openaiService will automatically calculate safe max based on available context
    const documentMaxTokens = modelConfig.maxCompletionTokens || 4096;
    
    let rawContent;
    
    // Check if we need batched processing (for modify/create operations with large documents)
    // First check if it's a modify/create operation, then check if document is large enough
    const isModifyOrCreate = useSchema && 
                              !isComparison && 
                              operationType === 'instruct' && 
                              intent !== 'analyze' && 
                              (intent === 'modify' || intent === 'create') &&
                              targetDocumentIndex >= 0 &&
                              documents[targetDocumentIndex]?.text;
    
    let needsBatching = false;
    if (isModifyOrCreate) {
      const targetDoc = documents[targetDocumentIndex];
      // Estimate if output will exceed token limit (output is typically 1.3x input for modifications)
      const estimatedOutputTokens = estimateTokens(targetDoc.text) * 1.3;
      const maxCompletionTokens = modelConfig.maxCompletionTokens || 4096;
      // Use batching if estimated output exceeds 80% of limit (safety margin)
      needsBatching = estimatedOutputTokens > (maxCompletionTokens * 0.8);
    }
    
    if (needsBatching) {
      // Use batched processing for large documents
      const targetDoc = documents[targetDocumentIndex];
      rawContent = await processDocumentsInBatches({
        messages,
        targetDocumentText: targetDoc.text,
        instruction,
        useSchema: true,
        maxCompletionTokens: documentMaxTokens
      });
    } else {
      // Standard single-call processing
      const openAIOptions = {
        messages,
        temperature: 0.3,
        maxTokens: documentMaxTokens
      };
      
      // Add JSON response format if using schema (and not analyze/compare - they use regular prompts)
      // CRITICAL: Never use schema for comparisons, even if useSchema is true
      if (useSchema && !isComparison && operationType === 'instruct' && intent !== 'analyze') {
        openAIOptions.responseFormat = { type: 'json_object' };
      }
      
      const aiResponse = await callOpenAI(openAIOptions);
      rawContent = extractMessageContent(aiResponse);
    }
    
    // Step 5: Parse and validate response
    let parsedResponse;
    let finalOutput = '';
    let isModification = false;
    
    // Only use schema parsing if we actually used schema (not for analyze/compare)
    // CRITICAL: Never parse schema for comparisons - they must return plain text tables
    if (useSchema && !isComparison && operationType === 'instruct' && intent !== 'analyze') {
      // If batched processing was used, rawContent is already the extracted output text
      if (needsBatching) {
        isModification = intent === 'modify' || intent === 'create';
        finalOutput = rawContent; // Batched processing already extracted the output
        parsedResponse = null; // For batched, we don't have full schema response
      } else {
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
          ? (needsBatching ? 'Large document processed successfully in batches' : 'Document modification processed successfully')
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
      parsedResponse: parsedResponse !== null,
      usedBatching: needsBatching || false
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
