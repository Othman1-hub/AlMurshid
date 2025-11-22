import { generateText } from 'ai';
import { PLAN_GENERATION_SYSTEM_PROMPT, createPlanGenerationPrompt, formatConversationHistory } from '@/lib/ai/prompts';
import { ProjectPlan, Task } from '@/lib/types/task';
import { getAIModel } from '@/lib/ai/config';
import { NextRequest } from 'next/server';

// Simple ID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const runtime = 'edge';

/**
 * POST /api/generate-plan
 * 
 * Generates a structured project plan from conversation history.
 * Takes the chat messages and converts them into gamified task objects.
 * 
 * Request body:
 * {
 *   messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>
 * }
 * 
 * Returns: ProjectPlan object with structured tasks
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Invalid request: non-empty messages array required' },
        { status: 400 }
      );
    }

    // Format conversation history for the AI
    const conversationHistory = formatConversationHistory(messages);
    const userPrompt = createPlanGenerationPrompt(conversationHistory);

    // Use configured AI model for plan generation (supports GPT-4o-mini and DeepSeek V3)
    const result = await generateText({
      model: getAIModel(),
      system: PLAN_GENERATION_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 4000, // Allow for comprehensive plan generation
    });

    // Parse the AI response as JSON
    let planData: { projectName: string; projectDescription: string; tasks: Omit<Task, 'id'>[] };
    
    try {
      // Extract JSON from response (handle markdown code blocks if present)
      const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || result.text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : result.text;
      
      planData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.text);
      throw new Error('AI generated invalid JSON format');
    }

    // Validate and structure the plan
    if (!planData.projectName || !planData.tasks || !Array.isArray(planData.tasks)) {
      throw new Error('AI response missing required fields');
    }

    // Add unique IDs to tasks and calculate totals
    const tasksWithIds: Task[] = planData.tasks.map(task => ({
      ...task,
      id: generateId(),
    }));

    const totalXP = tasksWithIds.reduce((sum, task) => sum + task.xp, 0);
    const totalTime = tasksWithIds.reduce((sum, task) => sum + task.timeEstimate, 0);

    const projectPlan: ProjectPlan = {
      projectName: planData.projectName,
      projectDescription: planData.projectDescription,
      tasks: tasksWithIds,
      totalXP,
      totalTime,
    };

    // Validate task structure
    for (const task of projectPlan.tasks) {
      if (!task.name || !task.description || typeof task.xp !== 'number') {
        throw new Error('Invalid task structure in AI response');
      }
      if (!['easy', 'medium', 'hard', 'expert'].includes(task.difficulty)) {
        throw new Error(`Invalid difficulty level: ${task.difficulty}`);
      }
    }

    return Response.json(projectPlan, { status: 200 });

  } catch (error) {
    console.error('Generate plan API error:', error);
    return Response.json(
      { 
        error: 'Failed to generate project plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
