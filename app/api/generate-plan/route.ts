import { generateText } from 'ai';
import { PLAN_GENERATION_SYSTEM_PROMPT, PLAN_GENERATION_SYSTEM_PROMPT_EN, createPlanGenerationPrompt, formatConversationHistory } from '@/lib/ai/prompts';
import { ProjectPlan } from '@/lib/types/task';
import { getAIModel } from '@/lib/ai/config';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchProjectForUser } from '@/lib/projectAccess';

/**
 * POST /api/generate-plan
 * 
 * DATA FLOW:
 * 1. Receives conversation messages from generate page
 * 2. Validates user authentication and project ownership
 * 3. Checks project hasn't been generated yet
 * 4. Saves conversation to chat_session table
 * 5. Formats conversation history (last 10 messages)
 * 6. Calls AI with PLAN_GENERATION_SYSTEM_PROMPT to create structured JSON
 * 7. Parses JSON response (phases, tasks, constants, fragments)
 * 8. Inserts phases with pr_id tracking
 * 9. Inserts tasks with pr_id tracking and phase references
 * 10. Creates task dependencies
 * 11. Saves constants and fragments to memory table
 * 12. Updates project (brief, prompt, generate=true)
 * 13. Returns success response
 * 
 * Request body:
 * {
 *   messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>,
 *   projectId: number,
 *   language: 'ar' | 'en'
 * }
 * 
 * Returns: { success: true, plan: ProjectPlan } or { error: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, projectId, language = 'ar' } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Invalid request: non-empty messages array required' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return Response.json(
        { error: 'Invalid request: projectId is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { project, error: projectError } = await fetchProjectForUser(
      supabase,
      user.id,
      Number(projectId),
      '*'
    );

    if (projectError || !project) {
      return Response.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    if (project.generate === true) {
      return Response.json(
        { error: 'Project has already been generated' },
        { status: 400 }
      );
    }

    // Step 0: Create or get chat session and save messages
    let chatSessionId: number | null = null;
    
    try {
      // Get or create chat session
      const { data: existingSession } = await supabase
        .from('chat_session')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        chatSessionId = existingSession.id;
      } else {
        const { data: newSession, error: sessionError } = await supabase
          .from('chat_session')
          .insert([{
            user_id: user.id,
            project_id: projectId,
            title: `${project.name || 'Project'} - Planning Session`,
          }])
          .select('id')
          .single();

        if (sessionError) {
          console.warn('Failed to create chat session:', sessionError);
        } else {
          chatSessionId = newSession.id;
        }
      }

      // Save all messages to the database if we have a session
      if (chatSessionId) {
        const messagesToInsert = messages
          .filter((m: any) => m.role !== 'system') // Don't save system messages
          .map((m: any) => ({
            session_id: chatSessionId,
            role: m.role,
            content: m.content,
          }));

        if (messagesToInsert.length > 0) {
          const { error: messagesError } = await supabase
            .from('messages')
            .insert(messagesToInsert);

          if (messagesError) {
            console.warn('Failed to save messages:', messagesError);
          }
        }
      }
    } catch (sessionErr) {
      console.warn('Error handling chat session:', sessionErr);
    }

    // Format conversation history for the AI (only last 10 messages to reduce tokens)
    // Converts [{role, content}] -> "User: ...\n\nAssistant: ..." format
    const recentMessages = messages.slice(-10);
    const conversationHistory = formatConversationHistory(recentMessages);
    const userPrompt = createPlanGenerationPrompt(conversationHistory, language as 'ar' | 'en');

    // Use configured AI model for plan generation with language-specific prompt
    const systemPrompt = language === 'en' ? PLAN_GENERATION_SYSTEM_PROMPT_EN : PLAN_GENERATION_SYSTEM_PROMPT;
    const result = await generateText({
      model: getAIModel(),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 6000, // Increased for more comprehensive plans
    });

    // Parse the AI response as JSON
    interface AIGeneratedPlan {
      projectName: string;
      projectDescription: string;
      projectBrief: string;
      aiPrompt: string;
      phases: Array<{
        id: string;
        name: string;
        description: string;
        order: number;
      }>;
      tasks: Array<{
        id: string;
        name: string;
        description: string;
        xp: number;
        difficulty: string;
        hints: string[];
        tools: string[];
        timeEstimate: number;
        phaseId?: string;
        predecessors?: string[];
      }>;
      constants: Array<{
        id: string;
        label: string;
        description: string;
        category: string;
      }>;
      fragments: Array<{
        id: string;
        title: string;
        content: string;
      }>;
    }
    
    let planData: AIGeneratedPlan;
    
    try {
      // Extract JSON from response (handle markdown code blocks if present)
      const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || result.text.match(/```\n([\s\S]*?)\n```/);
      let jsonText = jsonMatch ? jsonMatch[1] : result.text;
      
      // Fix common JSON formatting issues from AI
      // Fix duplicate/malformed keys in tasks (e.g., "id": "name": "task-10")
      jsonText = jsonText.replace(/"id":\s*"name":\s*"(task-\d+)"/g, '"id": "$1", "name"');
      // Fix "name": "task-X" appearing before "id": "task-X"
      jsonText = jsonText.replace(/"name":\s*"(task-\d+)",?\s*"id":\s*"(task-\d+)"/g, '"id": "$2", "name"');
      // Remove any "name": "task-X" without proper value after it
      jsonText = jsonText.replace(/,?\s*"name":\s*"(task-\d+)",?\s*"id":/g, '"id":');
      
      planData = JSON.parse(jsonText);
      
      // Validate and fix task IDs if needed
      if (planData.tasks && Array.isArray(planData.tasks)) {
        planData.tasks = planData.tasks.map((task, index) => {
          // Fix malformed task IDs (e.g., "name": "task-10" should be "id": "task-10")
          if (!task.id || typeof task.id !== 'string') {
            task.id = `task-${index + 1}`;
          }
          // Ensure task has a proper name
          if (!task.name || task.name.startsWith('task-')) {
            task.name = `Task ${index + 1}`;
          }
          return task;
        });
      }
      
      // Fix phase references in tasks if needed
      if (planData.phases && planData.tasks) {
        const validPhaseIds = new Set(planData.phases.map(p => p.id));
        planData.tasks = planData.tasks.map(task => {
          if (task.phaseId && !validPhaseIds.has(task.phaseId)) {
            // Try to find matching phase or assign to first phase
            task.phaseId = planData.phases[0]?.id;
          }
          return task;
        });
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.text);
      console.error('Parse error details:', parseError);
      throw new Error('AI generated invalid JSON format');
    }

    // Validate required fields
    if (!planData.projectName || !planData.tasks || !Array.isArray(planData.tasks)) {
      throw new Error('AI response missing required fields');
    }

    // Update project with brief, prompt, and mark as generated
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        name: planData.projectName,
        description: planData.projectDescription,
        breif: planData.projectBrief,
        prompt: planData.aiPrompt,
        generate: true,
      })
      .eq('id', projectId);

    if (updateError) {
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    // Step 1: Insert phases into phases table with pr_id tracking
    // pr_id = unique phase ID within this project (prevents duplicates)
    const phaseIdMap: Record<string, number> = {}; // AI ID -> DB ID mapping
    let insertedPhases: any[] = [];
    
    if (planData.phases && planData.phases.length > 0) {
      // Get the max pr_id for this project to avoid duplicates
      const { data: existingPhases } = await supabase
        .from('phases')
        .select('pr_id')
        .eq('project_id', projectId)
        .order('pr_id', { ascending: false })
        .limit(1);
      
      const startPrId = existingPhases && existingPhases.length > 0 ? (existingPhases[0].pr_id + 1) : 1;
      
      const phasesToInsert = planData.phases.map((phase, index) => ({
        project_id: projectId,
        pr_id: startPrId + index,
        name: phase.name,
        description: phase.description,
        order_index: phase.order,
      }));

      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .insert(phasesToInsert)
        .select();

      if (phasesError) {
        throw new Error(`Failed to insert phases: ${phasesError.message}`);
      }

      insertedPhases = phasesData || [];

      // Create mapping from AI-generated ID to database ID
      insertedPhases.forEach((dbPhase, index) => {
        const aiPhase = planData.phases[index];
        phaseIdMap[aiPhase.id] = dbPhase.id;
      });
    }

    // Step 2: Insert tasks into tasks table with pr_id tracking
    // pr_id = unique task ID within this project (prevents duplicates)
    const taskIdMap: Record<string, number> = {}; // AI ID -> DB ID mapping
    
    // Get the max pr_id for this project to avoid duplicates
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('pr_id')
      .eq('project_id', projectId)
      .order('pr_id', { ascending: false })
      .limit(1);
    
    const startPrId = existingTasks && existingTasks.length > 0 ? (existingTasks[0].pr_id + 1) : 1;
    
    // Map tasks with proper status enum value (always not_started for new tasks)
    const tasksToInsert = planData.tasks.map((task, index) => ({
      project_id: projectId,
      pr_id: startPrId + index,
      name: task.name,
      description: task.description,
      xp: task.xp,
      difficulty: task.difficulty,
      time_estimate: task.timeEstimate,
      tools: JSON.stringify(task.tools),
      hints: JSON.stringify(task.hints),
      status: 'not_started' as const, // Force correct enum value
      phase_id: task.phaseId ? phaseIdMap[task.phaseId] : null,
    }));

    // Log first task to debug status issue
    if (tasksToInsert.length > 0) {
      console.log('First task to insert:', JSON.stringify(tasksToInsert[0], null, 2));
    }

    const { data: insertedTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (tasksError) {
      throw new Error(`Failed to insert tasks: ${tasksError.message}`);
    }

    // Create mapping from AI-generated ID to database ID
    insertedTasks.forEach((dbTask, index) => {
      const aiTask = planData.tasks[index];
      taskIdMap[aiTask.id] = dbTask.id;
    });

    // Step 3: Insert task dependencies
    const dependenciesToInsert: Array<{
      task_id: number;
      predecessor_task_id: number;
    }> = [];

    planData.tasks.forEach((task) => {
      if (task.predecessors && task.predecessors.length > 0) {
        task.predecessors.forEach((predecessorId) => {
          if (taskIdMap[task.id] && taskIdMap[predecessorId]) {
            dependenciesToInsert.push({
              task_id: taskIdMap[task.id],
              predecessor_task_id: taskIdMap[predecessorId],
            });
          }
        });
      }
    });

    if (dependenciesToInsert.length > 0) {
      const { error: depsError } = await supabase
        .from('task_dependencies')
        .insert(dependenciesToInsert);

      if (depsError) {
        console.warn('Failed to insert dependencies:', depsError);
      }
    }

    // Step 4: Insert constants as memory items (with reversed content and description)
    if (planData.constants && planData.constants.length > 0) {
      const constantsToInsert = planData.constants.map(constant => ({
        project_id: projectId,
        type: 'constants',
        label: constant.category, // Label is the category (tool, feature, etc.)
        content: constant.label, // Reversed: original label in content
        description: constant.description, // Reversed: description in description field
        meta_data: { category: constant.category },
      }));

      const { error: constantsError } = await supabase
        .from('memory')
        .insert(constantsToInsert);

      if (constantsError) {
        console.warn('Failed to insert constants:', constantsError);
      }
    }

    // Step 5: Insert fragments as memory items
    if (planData.fragments && planData.fragments.length > 0) {
      const fragmentsToInsert = planData.fragments.map(fragment => ({
        project_id: projectId,
        type: 'fragments',
        label: fragment.title,
        content: fragment.content,
        description: 'Brainstorming idea',
        meta_data: {},
      }));

      const { error: fragmentsError } = await supabase
        .from('memory')
        .insert(fragmentsToInsert);

      if (fragmentsError) {
        console.warn('Failed to insert fragments:', fragmentsError);
      }
    }

    // Calculate totals
    const totalXP = planData.tasks.reduce((sum, task) => sum + task.xp, 0);
    const totalTime = planData.tasks.reduce((sum, task) => sum + task.timeEstimate, 0);

    const projectPlan: ProjectPlan = {
      projectName: planData.projectName,
      projectDescription: planData.projectDescription,
      projectBrief: planData.projectBrief,
      aiPrompt: planData.aiPrompt,
      tasks: insertedTasks,
      phases: insertedPhases || [],
      constants: [],
      fragments: [],
      totalXP,
      totalTime,
    };

    return Response.json({ success: true, plan: projectPlan }, { status: 200 });

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
