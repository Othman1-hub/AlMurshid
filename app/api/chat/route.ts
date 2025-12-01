import { streamText } from 'ai';
import { PROJECT_PLANNING_SYSTEM_PROMPT, ALMURSHID_ASSISTANT_PROMPT } from '@/lib/ai/prompts';
import { alMurshidTools } from '@/lib/ai/tools';
import { getAIModel } from '@/lib/ai/config';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchProjectForUser } from '@/lib/projectAccess';

// Use Node.js runtime to support Server Actions with proper authentication
// Edge runtime has limited cookie/session access which breaks Server Actions
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat
 * 
 * DATA FLOW - Two distinct modes:
 * 
 * MODE 1: GENERATE (Information Gathering)
 * - Used by: Generate page (/dashboard/[projectId]/generate)
 * - Prompt: PROJECT_PLANNING_SYSTEM_PROMPT
 * - Purpose: Ask questions, gather project info, NO task creation
 * - Tools: NONE
 * - Flow: User describes project -> AI asks clarifying questions -> When enough info collected,
 *         AI says "✅ Click Generate Plan" -> User clicks button -> Triggers /api/generate-plan
 * 
 * MODE 2: ASSISTANT (Task Management)
 * - Used by: AI page (/dashboard/[projectId]/ai)
 * - Prompt: ALMURSHID_ASSISTANT_PROMPT
 * - Purpose: Manage existing project tasks, phases, dependencies
 * - Tools: 14 tools (getTasks, createTask, updateTask, etc.)
 * - Flow: User requests task changes -> AI uses tools to modify database -> Returns confirmation
 * 
 * Request body:
 * {
 *   messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>,
 *   projectId?: number,
 *   mode: 'generate' | 'assistant',
 *   language?: 'ar' | 'en'
 * }
 * 
 * Returns: Streaming text response from configured AI model
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, projectId, mode, language } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request: messages array required', { status: 400 });
    }

    // Determine which system prompt to use based on mode
    let systemPrompt = PROJECT_PLANNING_SYSTEM_PROMPT;
    let enhancedMessages = messages;
    let useTools = false;

    // Only use ALMURSHID_ASSISTANT_PROMPT with tools when in 'assistant' mode (ai page)
    if (projectId && mode === 'assistant') {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return new Response('Unauthorized', { status: 401 });
      }

      // Fetch fresh project data directly from database
      const { project, error } = await fetchProjectForUser(
        supabase,
        user.id,
        Number(projectId),
        '*'
      );

      if (!project || error) {
        return new Response('Project not found', { status: 404 });
      }

      // Fetch all related data in parallel for efficiency
      const [
        { data: tasks },
        { data: phases },
        { data: dependencies },
        { data: memories }
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
        supabase.from('phases').select('*').eq('project_id', projectId).order('order_index', { ascending: true }),
        supabase.from('task_dependencies').select('*').eq('project_id', projectId),
        supabase.from('memory').select('*').eq('project_id', projectId)
      ]);

      systemPrompt = ALMURSHID_ASSISTANT_PROMPT;
      
      // Build concise context from fresh database data
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;
      const inProgressTasks = tasks?.filter((t: any) => t.status === 'in_progress').length || 0;
      const blockedTasks = tasks?.filter((t: any) => t.status === 'blocked').length || 0;
      const totalXP = tasks?.reduce((sum: number, t: any) => sum + (t.xp || 0), 0) || 0;
      const earnedXP = tasks?.filter((t: any) => t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (t.xp || 0), 0) || 0;

      // Build concise phase info (top 3 phases with task counts only)
      let phasesInfo = '';
      phases?.slice(0, 3).forEach((phase: any) => {
        const phaseTasks = tasks?.filter((t: any) => t.phase_id === phase.id) || [];
        phasesInfo += `\n- ${phase.name}: ${phaseTasks.length} tasks`;
      });
      if (phases && phases.length > 3) {
        phasesInfo += `\n- ...and ${phases.length - 3} more phases`;
      }

      const contextInfo = `
Project Info:
ID: ${projectId} | Name: ${project?.name || 'N/A'}

Stats:
Tasks: ${totalTasks} (✅${completedTasks} ⏳${inProgressTasks} 🔒${blockedTasks})
XP: ${earnedXP}/${totalXP} | Phases: ${phases?.length || 0} | Deps: ${dependencies?.length || 0}
${phasesInfo}

Use projectId ${projectId} in all tool operations.
`;

      enhancedMessages = [
        { role: 'system', content: contextInfo },
        ...messages
      ];
      
      useTools = true;
    }

    // Use configured AI model for cost-effective conversational planning
    const result = streamText({
      model: getAIModel(),
      system: systemPrompt,
      messages: enhancedMessages,
      temperature: 0.7,
      maxTokens: mode === 'assistant' ? 1000 : 2000, // More tokens for generate conversations
      tools: useTools ? alMurshidTools : undefined,
      toolChoice: useTools ? 'auto' : undefined,
      maxSteps: 5,
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
