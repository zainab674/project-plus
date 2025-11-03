import { openaiConfig, validateOpenAIConfig, getModelConfig } from '../config/openaiConfig.js';

/**
 * Centralized OpenAI Service
 * Handles all OpenAI API calls with retry logic, truncation, and error handling
 */

/**
 * Truncate text to a character limit
 * @param {string} text - Text to truncate
 * @param {number} charLimit - Maximum characters (optional)
 * @returns {{text: string, wasTruncated: boolean}} Truncated text and truncation flag
 */
export function truncateText(text = '', charLimit = null) {
  const limit = charLimit || openaiConfig.defaultCharLimit;
  
  if (!text || text.length <= limit) {
    return { text: text || '', wasTruncated: false };
  }
  
  // Try to truncate at a sentence boundary if possible
  const truncated = text.substring(0, limit);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const breakPoint = Math.max(lastPeriod, lastNewline);
  
  if (breakPoint > limit * 0.8) { // Only use break point if we're keeping >80% of text
    return {
      text: truncated.substring(0, breakPoint + 1) + '\n...[truncated]',
      wasTruncated: true
    };
  }
  
  return {
    text: truncated + '\n...[truncated]',
    wasTruncated: true
  };
}

/**
 * Estimate token count from text (rough approximation: 4 chars = 1 token)
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokens(text = '') {
  if (!text) return 0;
  // Rough approximation: 4 characters ≈ 1 token
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to a token limit (using character-based approximation)
 * @param {string} text - Text to truncate
 * @param {number} tokenLimit - Maximum tokens (optional)
 * @returns {{text: string, wasTruncated: boolean}} Truncated text and truncation flag
 */
export function truncateToTokenLimit(text = '', tokenLimit = null) {
  const limit = tokenLimit || openaiConfig.defaultTokenLimit;
  const charLimit = limit * 4; // Approximate: 4 chars per token
  return truncateText(text, charLimit);
}

/**
 * Sleep/delay helper for retries
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a model supports json_object response format
 * @param {string} model - Model name
 * @returns {boolean} True if model supports json_object response format
 */
function supportsJsonObjectResponseFormat(model) {
  if (!model) return false;
  
  // Normalize model name (lowercase, trim)
  const normalizedModel = model.toLowerCase().trim();
  
  // Explicit list of models that support json_object response format
  // Based on OpenAI documentation, these models support it:
  // Note: Base gpt-4 does NOT support json_object, only specific versions do
  const supportedModels = [
    'gpt-4-turbo',
    'gpt-4-turbo-preview',
    'gpt-4-0125-preview',
    'gpt-4-1106-preview',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo-0125',
  ];
  
  // Check exact matches
  if (supportedModels.includes(normalizedModel)) {
    return true;
  }
  
  // Check for gpt-4 variants with version numbers or turbo
  // Base gpt-4 (without version/turbo suffix) does NOT support json_object
  if (normalizedModel.startsWith('gpt-4') && 
      (normalizedModel.includes('turbo') || 
       normalizedModel.match(/^gpt-4-\d+/))) {
    // GPT-4 models with version numbers or turbo support it
    return true;
  }
  
  // Check for gpt-3.5-turbo with version number
  const versionMatch = normalizedModel.match(/gpt-3\.5-turbo-(\d+)/);
  if (versionMatch) {
    const version = parseInt(versionMatch[1]);
    // Version 1106 and later support json_object
    return version >= 1106;
  }
  
  // Default: assume it doesn't support it (conservative approach)
  return false;
}

/**
 * Determine if an error is retryable
 * @param {Error} error - Error to check
 * @param {number} statusCode - HTTP status code (if available)
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error, statusCode = null) {
  // Check status code from error message if available
  if (statusCode) {
    // Retry on rate limits (429) and server errors (5xx)
    return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
  }
  
  // Check error message for common retryable patterns
  const errorMessage = error?.message?.toLowerCase() || '';
  return errorMessage.includes('rate limit') ||
         errorMessage.includes('429') ||
         errorMessage.includes('timeout') ||
         errorMessage.includes('server error') ||
         errorMessage.includes('internal server');
}

/**
 * Safely extract message content from OpenAI response
 * @param {Object} responseData - OpenAI API response data
 * @returns {string} Extracted content or empty string
 */
export function extractMessageContent(responseData) {
  try {
    if (!responseData) {
      return '';
    }
    
    // Handle different response structures
    if (typeof responseData === 'string') {
      return responseData;
    }
    
    // Standard OpenAI response structure
    if (responseData.choices && Array.isArray(responseData.choices) && responseData.choices.length > 0) {
      const choice = responseData.choices[0];
      if (choice.message && choice.message.content) {
        return choice.message.content;
      }
      // Fallback: check for delta in streaming responses
      if (choice.delta && choice.delta.content) {
        return choice.delta.content;
      }
    }
    
    // Fallback: try to find content in various possible locations
    if (responseData.content) {
      return responseData.content;
    }
    
    if (responseData.text) {
      return responseData.text;
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting message content:', error);
    return '';
  }
}

/**
 * Make OpenAI API call with retry logic and error handling
 * @param {Object} options - Request options
 * @param {Array} options.messages - Array of message objects {role, content}
 * @param {string} options.model - Model name (optional)
 * @param {number} options.temperature - Temperature (optional)
 * @param {number} options.maxTokens - Max tokens (optional)
 * @param {Object} options.responseFormat - Response format (e.g., {type: "json_object"}) (optional)
 * @param {number} options.customRetries - Custom retry count (optional)
 * @returns {Promise<Object>} OpenAI API response
 */
export async function callOpenAI({
  messages = [],
  model = null,
  temperature = null,
  maxTokens = null,
  responseFormat = null,
  customRetries = null,
}) {
  // Validate configuration
  validateOpenAIConfig();
  
  // Get model configuration
  const selectedModel = model || openaiConfig.defaultModel;
  const modelConfig = getModelConfig(selectedModel);
  
  // Estimate input tokens from messages
  const messagesText = messages.map(msg => 
    (msg.role || '') + ': ' + (msg.content || '')
  ).join('\n');
  const estimatedInputTokens = estimateTokens(messagesText);
  
  // Get model's maximum context length (default to 8192 for gpt-4 if not specified)
  const maxContextLength = modelConfig.maxTokens || openaiConfig.defaultMaxTokens;
  
  // Calculate available tokens for completion (leave 100 token safety margin)
  const safetyMargin = 100;
  const availableTokens = Math.max(0, maxContextLength - estimatedInputTokens - safetyMargin);
  
  // Determine requested max tokens
  const requestedMaxTokens = maxTokens !== null ? maxTokens : (modelConfig.maxTokens || openaiConfig.defaultMaxTokens);
  
  // Use the minimum of requested tokens and available tokens
  const safeMaxTokens = Math.min(requestedMaxTokens, availableTokens);
  
  // Warn if we had to reduce the max_tokens
  if (safeMaxTokens < requestedMaxTokens) {
    console.warn(
      `Reduced max_tokens from ${requestedMaxTokens} to ${safeMaxTokens} ` +
      `due to context limit. Model: ${selectedModel}, ` +
      `Context limit: ${maxContextLength}, Estimated input tokens: ${estimatedInputTokens}`
    );
  }
  
  // Build request body
  const requestBody = {
    model: selectedModel,
    messages: messages,
    temperature: temperature !== null ? temperature : openaiConfig.defaultTemperature,
    max_tokens: safeMaxTokens,
  };
  
  // Add response format if specified and model supports it
  if (responseFormat) {
    // Check if this is a json_object response format request
    if (responseFormat.type === 'json_object') {
      const supportsJson = supportsJsonObjectResponseFormat(selectedModel);
      if (supportsJson) {
        requestBody.response_format = responseFormat;
        console.log(`Using json_object response format for model: ${selectedModel}`);
      } else {
        // Model doesn't support json_object, warn and skip it
        console.warn(`Model "${selectedModel}" does not support json_object response format. Skipping response_format parameter. The model will be instructed to return JSON via prompts instead.`);
      }
    } else {
      // For other response formats, add as-is (assuming they're valid)
      requestBody.response_format = responseFormat;
    }
  }
  
  // Determine retry count
  const maxRetries = customRetries !== null ? customRetries : openaiConfig.maxRetries;
  
  // Get fetch function (Node.js or browser)
  let _fetch = globalThis.fetch;
  if (!_fetch) {
    const { default: nodeFetch } = await import('node-fetch');
    _fetch = nodeFetch;
  }
  
  let lastError = null;
  let delay = openaiConfig.retryDelay;
  
  // Retry loop
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await _fetch(openaiConfig.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiConfig.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      // Handle rate limit tracking
      if (openaiConfig.enableRateLimitTracking) {
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining-requests');
        const rateLimitReset = response.headers.get('x-ratelimit-reset-requests');
        if (rateLimitRemaining !== null) {
          console.log(`OpenAI Rate Limit: ${rateLimitRemaining} requests remaining, resets at ${rateLimitReset}`);
        }
      }
      
      // Check if request was successful
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      // Handle non-OK responses
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      const errorMessage = errorData.error?.message || errorData.message || errorText;
      const error = new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${errorMessage}`
      );
      error.statusCode = response.status;
      
      // Special handling for unsupported response_format error
      // If we get a 400 error about json_object not being supported, remove it and retry once
      if (response.status === 400 && 
          errorMessage.includes('response_format') && 
          errorMessage.includes('json_object') &&
          requestBody.response_format?.type === 'json_object' &&
          attempt === 0) { // Only do this on first attempt
        console.warn(`Model ${selectedModel} does not support json_object response format (received from API). Removing parameter and retrying...`);
        delete requestBody.response_format;
        // Retry immediately without the parameter
        continue;
      }
      
      // Special handling for context length errors
      // If we get a 400 error about exceeding maximum context length, reduce max_tokens and retry
      if (response.status === 400 && 
          (errorMessage.includes('maximum context length') || 
           errorMessage.includes('context length is') ||
           errorMessage.includes('you requested')) &&
          requestBody.max_tokens > 0 &&
          attempt < maxRetries) {
        // Extract the actual input token count from error message if possible
        // Error format: "This model's maximum context length is 8192 tokens. However, you requested 8474 tokens (4474 in the messages, 4000 in the completion)."
        const inputTokensMatch = errorMessage.match(/(\d+)\s+in\s+the\s+messages/i);
        const completionTokensMatch = errorMessage.match(/(\d+)\s+in\s+the\s+completion/i);
        const maxContextMatch = errorMessage.match(/context\s+length\s+is\s+(\d+)\s+tokens/i) || 
                               errorMessage.match(/maximum\s+context\s+length\s+is\s+(\d+)/i);
        
        if (inputTokensMatch && maxContextMatch) {
          const actualInputTokens = parseInt(inputTokensMatch[1]);
          const actualMaxContext = parseInt(maxContextMatch[1]);
          
          // Calculate safe max_tokens: context limit - input tokens - safety margin
          const newMaxTokens = Math.max(1, actualMaxContext - actualInputTokens - safetyMargin);
          
          console.warn(
            `Context length exceeded. Adjusting max_tokens from ${requestBody.max_tokens} to ${newMaxTokens}. ` +
            `Model: ${selectedModel}, Actual input tokens: ${actualInputTokens}, Context limit: ${actualMaxContext}`
          );
          
          requestBody.max_tokens = newMaxTokens;
          // Retry immediately with adjusted tokens
          continue;
        } else if (maxContextMatch) {
          // If we can only get the max context, use our earlier estimate
          const actualMaxContext = parseInt(maxContextMatch[1]);
          // Use the estimatedInputTokens calculated earlier in the function
          const newMaxTokens = Math.max(1, actualMaxContext - estimatedInputTokens - safetyMargin);
          
          console.warn(
            `Context length exceeded. Adjusting max_tokens from ${requestBody.max_tokens} to ${newMaxTokens}. ` +
            `Model: ${selectedModel}, Context limit: ${actualMaxContext}, Estimated input tokens: ${estimatedInputTokens}`
          );
          
          requestBody.max_tokens = newMaxTokens;
          continue;
        } else {
          // Fallback: reduce max_tokens by 30% and retry
          const newMaxTokens = Math.max(1, Math.floor(requestBody.max_tokens * 0.7));
          console.warn(
            `Context length exceeded. Reducing max_tokens from ${requestBody.max_tokens} to ${newMaxTokens} ` +
            `(could not parse exact token counts from error message)`
          );
          requestBody.max_tokens = newMaxTokens;
          continue;
        }
      }
      
      // Check if retryable
      if (isRetryableError(error, response.status) && attempt < maxRetries) {
        lastError = error;
        console.warn(`OpenAI API call failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`);
        await sleep(delay);
        delay *= openaiConfig.retryBackoffMultiplier; // Exponential backoff
        continue;
      }
      
      // Not retryable or out of retries
      throw error;
      
    } catch (error) {
      lastError = error;
      
      // Check if retryable
      if (isRetryableError(error, error.statusCode) && attempt < maxRetries) {
        console.warn(`OpenAI API call failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`);
        await sleep(delay);
        delay *= openaiConfig.retryBackoffMultiplier; // Exponential backoff
        continue;
      }
      
      // Not retryable or out of retries
      if (attempt === maxRetries) {
        throw lastError || error;
      }
    }
  }
  
  // Should never reach here, but just in case
  throw lastError || new Error('OpenAI API call failed after all retries');
}

/**
 * Helper function to create a simple chat completion
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @param {Object} options - Additional options (model, temperature, maxTokens, etc.)
 * @returns {Promise<string>} Extracted message content
 */
export async function simpleChatCompletion(systemPrompt, userPrompt, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  const response = await callOpenAI({
    messages,
    ...options
  });
  
  return extractMessageContent(response);
}

/**
 * Helper function to create a chat completion with JSON response format
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function jsonChatCompletion(systemPrompt, userPrompt, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  const response = await callOpenAI({
    messages,
    responseFormat: { type: 'json_object' },
    ...options
  });
  
  const content = extractMessageContent(response);
  
  try {
    // Try to parse as JSON
    return JSON.parse(content);
  } catch (parseError) {
    // Try to extract JSON from markdown code blocks or plain text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('Failed to parse JSON response from OpenAI');
      }
    }
    throw new Error('No valid JSON found in OpenAI response');
  }
}
