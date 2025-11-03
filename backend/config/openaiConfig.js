import { config } from "dotenv";

config();

/**
 * OpenAI Configuration
 * Centralized configuration for all OpenAI API calls
 */
export const openaiConfig = {
  // API Configuration
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions',
  
  // Model Configuration
  // Note: gpt-4 does NOT support json_object response format, use gpt-4-turbo or gpt-4o instead
  defaultModel: process.env.OPENAI_MODEL || 'gpt-4-turbo',
  defaultTemperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
  defaultMaxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096'),
  
  // Truncation Configuration
  // Character-based truncation (rough estimate: 4 chars = 1 token)
  defaultCharLimit: parseInt(process.env.OPENAI_CHAR_LIMIT || '16000'),
  defaultTokenLimit: parseInt(process.env.OPENAI_TOKEN_LIMIT || '4000'),
  
  // Retry Configuration
  maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.OPENAI_RETRY_DELAY || '1000'), // milliseconds
  retryBackoffMultiplier: parseFloat(process.env.OPENAI_BACKOFF_MULTIPLIER || '2'),
  
  // Rate Limit Headers (for monitoring)
  enableRateLimitTracking: process.env.OPENAI_ENABLE_RATE_LIMIT_TRACKING === 'true',
};

/**
 * Validate OpenAI configuration
 * @returns {boolean} True if configuration is valid
 */
export function validateOpenAIConfig() {
  if (!openaiConfig.apiKey) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
  }
  return true;
}

/**
 * Get model-specific configuration
 * @param {string} model - Model name (optional)
 * @returns {Object} Model-specific settings
 */
export function getModelConfig(model = null) {
  const selectedModel = model || openaiConfig.defaultModel;
  
  // Model-specific configurations
  const modelConfigs = {
    'gpt-4': {
      maxTokens: 8192,
      charLimit: 32000, // Rough estimate
    },
    'gpt-4-turbo': {
      maxTokens: 128000,
      charLimit: 500000,
    },
    'gpt-3.5-turbo': {
      maxTokens: 4096,
      charLimit: 16000,
    },
  };
  
  return modelConfigs[selectedModel] || {
    maxTokens: openaiConfig.defaultMaxTokens,
    charLimit: openaiConfig.defaultCharLimit,
  };
}
