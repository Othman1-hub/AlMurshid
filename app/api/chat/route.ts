import { streamText } from 'ai';
import { PROJECT_PLANNING_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { getAIModel } from '@/lib/ai/config';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * POST /api/chat
 * 
 * Conversational endpoint for project planning.
 * User chats with AI to define their project before generating the plan.
 * 
 * Request body:
 * {
 *   messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>
 * }
 * 
 * Returns: Streaming text response from GPT-4o-mini
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request: messages array required', { status: 400 });
    }

    // Use configured AI model for cost-effective conversational planning
    const result = streamText({
      model: getAIModel(),
      system: PROJECT_PLANNING_SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxTokens: 500, // Keep responses concise during conversation
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
