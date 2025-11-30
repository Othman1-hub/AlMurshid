import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateText } from 'ai';
import { getAIModel } from '@/lib/ai/config';
import { PROMPT_REGENERATION_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch project data
    const [projectRes, tasksRes, phasesRes, memoryRes] = await Promise.all([
      supabase.from('projects').select('name, description, breif').eq('id', projectId).single(),
      supabase.from('tasks').select('name, description, status, difficulty, xp, tools, hints').eq('project_id', projectId),
      supabase.from('phases').select('name, description, order_index').eq('project_id', projectId).order('order_index'),
      supabase.from('memory').select('type, label, description').eq('project_id', projectId),
    ]);

    if (projectRes.error) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectRes.data;
    const tasks = tasksRes.data || [];
    const phases = phasesRes.data || [];
    const memory = memoryRes.data || [];

    // Build context for AI
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const remainingTasks = tasks.filter(t => t.status !== 'completed');
    const technologies = memory.filter(m => m.type === 'constants').map(m => m.label);

    const contextPrompt = `
Project Name: ${project.name}
Project Description: ${project.description || 'N/A'}
Brief: ${project.breif || 'N/A'}

Phases (${phases.length}):
${phases.map(p => `- ${p.name}: ${p.description}`).join('\n')}

Tasks:
- Total: ${tasks.length}
- Completed: ${completedTasks.length}
- Remaining: ${remainingTasks.length}
- Difficulty breakdown: ${tasks.reduce((acc, t) => { acc[t.difficulty] = (acc[t.difficulty] || 0) + 1; return acc; }, {} as any)}

Technologies/Tools:
${technologies.length > 0 ? technologies.join(', ') : 'Not specified'}

Key Tasks:
${tasks.slice(0, 10).map(t => `- ${t.name} (${t.status}, ${t.difficulty}, ${t.xp} XP)`).join('\n')}

Generate a comprehensive AI prompt based on this project data.`;

    // Generate new prompt using AI
    const result = await generateText({
      model: getAIModel(),
      system: PROMPT_REGENERATION_SYSTEM_PROMPT,
      prompt: contextPrompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    const newPrompt = result.text.trim();

    // Update project with new prompt
    const { error: updateError } = await supabase
      .from('projects')
      .update({ prompt: newPrompt })
      .eq('id', projectId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
    }

    return NextResponse.json({ success: true, prompt: newPrompt });
  } catch (error) {
    console.error('Error regenerating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate prompt', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
