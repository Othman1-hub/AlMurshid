/**
 * AI Configuration Utilities
 * 
 * This module handles switching between different AI providers
 * (GPT-4o-mini, DeepSeek V3, etc.)
 */

import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';

export type AIProvider = 'openai' | 'deepseek';

/**
 * Configuration for DeepSeek API
 * DeepSeek uses OpenAI-compatible API format
 */
const deepseek = createOpenAI({
  name: 'deepseek',
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

/**
 * Get the AI model based on provider configuration
 * 
 * @param provider - 'openai' for GPT-4o-mini or 'deepseek' for DeepSeek V3
 * @returns Configured AI model instance
 */
export function getAIModel(provider: AIProvider = 'openai') {
  switch (provider) {
    case 'deepseek':
      return deepseek('deepseek-chat'); // DeepSeek V3 model
    case 'openai':
    default:
      return openai('gpt-4o-mini');
  }
}

/**
 * Get current AI provider from environment or default to OpenAI
 */
export function getCurrentProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  return provider === 'deepseek' ? 'deepseek' : 'openai';
}
