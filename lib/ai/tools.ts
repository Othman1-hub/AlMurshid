/**
 * AI Tool definitions for المرشد (Al-Murshid) assistant
 * These tools allow the AI to perform CRUD operations on tasks, phases, and dependencies
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { 
  createTask, updateTask, deleteTask
} from '@/app/actions/tasks';
import {
  createPhase as createPhaseAction,
  updatePhase as updatePhaseAction,
  deletePhase as deletePhaseAction
} from '@/app/actions/phases';
import {
  addTaskDependency as addDependencyAction,
  removeTaskDependency as removeDependencyAction
} from '@/app/actions/dependencies';

/**
 * Task Management Tools
 */

export const createTaskTool = tool({
  description: 'Create a new task in the project. Use this when the user asks to add, create, or insert a new task.',
  parameters: z.object({
    projectId: z.number().describe('The project ID'),
    name: z.string().describe('Task name (3-7 words, action-oriented)'),
    description: z.string().describe('Task description (1-2 sentences)'),
    xp: z.number().min(10).max(500).describe('Experience points (10-50 easy, 50-150 medium, 150-300 hard, 300-500 expert)'),
    difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).describe('Task difficulty level'),
    timeEstimate: z.number().min(0.5).max(40).describe('Estimated time in hours'),
    tools: z.string().optional().describe('JSON array of tools/technologies needed'),
    hints: z.string().optional().describe('JSON array of helpful hints'),
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).default('not_started').optional().describe('Initial status (default: not_started)'),
    phaseId: z.number().optional().describe('Phase ID this task belongs to (optional, can be null)'),
  }),
  execute: async ({ projectId, name, description, xp, difficulty, timeEstimate, tools, hints, status, phaseId }) => {
    try {
      // Verify we have a valid project ID
      if (!projectId || isNaN(projectId) || projectId <= 0) {
        return { 
          success: false, 
          error: 'معرف المشروع غير صحيح. يجب أن يكون معرف المشروع رقماً موجباً صحيحاً.'
        };
      }

      // Build task data object, only including defined values
      const taskData: any = {
        name,
        description,
        xp,
        difficulty,
        time_estimate: timeEstimate,
      };

      // Only add optional fields if they are provided
      if (tools !== undefined) taskData.tools = tools;
      if (hints !== undefined) taskData.hints = hints;
      if (status !== undefined) taskData.status = status;
      if (phaseId !== undefined) taskData.phase_id = phaseId;

      const result = await createTask(projectId, taskData);

      if (result.error) {
        // Provide more helpful error messages with detailed error info
        console.error('Task creation error:', result.error);
        
        if (result.error.includes('not authenticated')) {
          return { 
            success: false, 
            error: 'فشل التحقق من الهوية. يرجى تسجيل الدخول مرة أخرى.'
          };
        }
        if (result.error.includes('not found') || result.error.includes('unauthorized')) {
          return { 
            success: false, 
            error: `المشروع رقم ${projectId} غير موجود أو لا يمكنك الوصول إليه. تأكد من معرف المشروع الصحيح.`
          };
        }
        
        // Return the actual error for debugging
        return { 
          success: false, 
          error: `فشل في إنشاء المهمة: ${result.error}`
        };
      }

      return { 
        success: true, 
        task: result.task,
        message: `✅ تم إنشاء المهمة "${name}" بنجاح (${xp} XP)`
      };
    } catch (error) {
      console.error('Task creation exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? `خطأ: ${error.message}` : 'فشل في إنشاء المهمة'
      };
    }
  },
});

export const updateTaskTool = tool({
  description: 'Update an existing task. Use this to modify task properties like name, description, status, difficulty, XP, etc.',
  parameters: z.object({
    taskId: z.number().describe('The task ID to update'),
    projectId: z.number().describe('The project ID'),
    name: z.string().optional().describe('New task name'),
    description: z.string().optional().describe('New task description'),
    xp: z.number().min(10).max(500).optional().describe('New XP value'),
    difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional().describe('New difficulty level'),
    timeEstimate: z.number().min(0.5).max(40).optional().describe('New time estimate in hours'),
    tools: z.string().optional().describe('New tools JSON array'),
    hints: z.string().optional().describe('New hints JSON array'),
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).optional().describe('New status'),
    phaseId: z.number().nullable().optional().describe('New phase ID'),
  }),
  execute: async ({ taskId, projectId, ...updates }) => {
    try {
      const result = await updateTask(taskId, projectId, {
        ...updates,
        time_estimate: updates.timeEstimate,
        phase_id: updates.phaseId,
      });

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { 
        success: true, 
        task: result.task,
        message: `✅ تم تحديث المهمة بنجاح`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update task' 
      };
    }
  },
});

export const deleteTaskTool = tool({
  description: 'Delete a task from the project. Use this when the user asks to remove or delete a task.',
  parameters: z.object({
    taskId: z.number().describe('The task ID to delete'),
    projectId: z.number().describe('The project ID'),
  }),
  execute: async ({ taskId, projectId }) => {
    try {
      const result = await deleteTask(taskId, projectId);

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { 
        success: true,
        message: `✅ تم حذف المهمة بنجاح`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete task' 
      };
    }
  },
});

/**
 * Phase Management Tools
 */

export const createPhaseTool = tool({
  description: 'Create a new phase in the project. Phases are logical groupings of tasks (e.g., Planning, Development, Testing).',
  parameters: z.object({
    projectId: z.number().describe('The project ID'),
    name: z.string().describe('Phase name (e.g., "Planning & Setup", "Core Development")'),
    description: z.string().describe('Phase description explaining what this phase accomplishes'),
    orderIndex: z.number().describe('Order of this phase in the project sequence (starting from 1)'),
  }),
  execute: async ({ projectId, name, description, orderIndex }) => {
    try {
      const result = await createPhaseAction(projectId, {
        name,
        description,
        order_index: orderIndex,
      });

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { 
        success: true, 
        phase: result.phase,
        message: `✅ تم إنشاء المرحلة "${name}" بنجاح`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create phase' 
      };
    }
  },
});

export const updatePhaseTool = tool({
  description: 'Update an existing phase. Use this to modify phase name, description, or order.',
  parameters: z.object({
    phaseId: z.number().describe('The phase ID to update'),
    projectId: z.number().describe('The project ID'),
    name: z.string().optional().describe('New phase name'),
    description: z.string().optional().describe('New phase description'),
    orderIndex: z.number().optional().describe('New order index'),
  }),
  execute: async ({ phaseId, projectId, orderIndex, ...updates }) => {
    try {
      const result = await updatePhaseAction(phaseId, projectId, {
        ...updates,
        order_index: orderIndex,
      });

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { 
        success: true, 
        phase: result.phase,
        message: `✅ تم تحديث المرحلة بنجاح`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update phase' 
      };
    }
  },
});

export const deletePhaseTool = tool({
  description: 'Delete a phase from the project. Tasks in this phase will become unassigned.',
  parameters: z.object({
    phaseId: z.number().describe('The phase ID to delete'),
    projectId: z.number().describe('The project ID'),
  }),
  execute: async ({ phaseId, projectId }) => {
    try {
      const result = await deletePhaseAction(phaseId, projectId);

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { 
        success: true,
        message: `✅ تم حذف المرحلة بنجاح`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete phase' 
      };
    }
  },
});

/**
 * Dependency Management Tools
 */

export const addDependencyTool = tool({
  description: 'Add a dependency between tasks. This means one task must be completed before another can start.',
  parameters: z.object({
    taskId: z.number().describe('The task that depends on another (the dependent task)'),
    predecessorTaskId: z.number().describe('The task that must be completed first (the predecessor)'),
    projectId: z.number().describe('The project ID'),
  }),
  execute: async ({ taskId, predecessorTaskId, projectId }) => {
    try {
      const result = await addDependencyAction(taskId, predecessorTaskId, projectId);

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { 
        success: true, 
        dependency: result.dependency,
        message: `✅ تم إضافة التبعية بنجاح`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add dependency' 
      };
    }
  },
});

export const removeDependencyTool = tool({
  description: 'Remove a dependency between tasks.',
  parameters: z.object({
    dependencyId: z.number().describe('The dependency ID to remove'),
    projectId: z.number().describe('The project ID'),
  }),
  execute: async ({ dependencyId, projectId }) => {
    try {
      const result = await removeDependencyAction(dependencyId, projectId);

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { 
        success: true,
        message: `✅ تم إزالة التبعية بنجاح`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove dependency' 
      };
    }
  },
});

/**
 * Data Reading Tools
 */

export const getTasksTool = tool({
  description: 'Get all tasks in the project with their details. Use this to see task names, statuses, XP, and other information.',
  parameters: z.object({
    projectId: z.number().describe('The project ID'),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'غير مصرح' };
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        tasks,
        summary: `تم العثور على ${tasks?.length || 0} مهمة`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في جلب المهام',
      };
    }
  },
});

export const getPhasesTool = tool({
  description: 'Get all phases in the project with their tasks count and details.',
  parameters: z.object({
    projectId: z.number().describe('The project ID'),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'غير مصرح' };
      }

      const { data: phases, error } = await supabase
        .from('phases')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        phases,
        summary: `تم العثور على ${phases?.length || 0} مرحلة`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في جلب المراحل',
      };
    }
  },
});

export const getTaskDetailsTool = tool({
  description: 'Get detailed information about a specific task including its phase, dependencies, and full description.',
  parameters: z.object({
    projectId: z.number().describe('The project ID'),
    taskId: z.number().describe('The task ID to get details for'),
  }),
  execute: async ({ projectId, taskId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'غير مصرح' };
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('project_id', projectId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Get dependencies
      const { data: dependencies } = await supabase
        .from('task_dependencies')
        .select('*, predecessor:predecessor_task_id(id, name)')
        .eq('task_id', taskId);

      return {
        success: true,
        task,
        dependencies,
        message: `تفاصيل المهمة: ${task?.name}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في جلب تفاصيل المهمة',
      };
    }
  },
});

export const getProjectStatsTool = tool({
  description: 'Get comprehensive statistics about the project including total XP, completed tasks, progress percentage, and phase breakdown.',
  parameters: z.object({
    projectId: z.number().describe('The project ID'),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'غير مصرح' };
      }

      // Fetch all data in parallel
      const [
        { data: tasks },
        { data: phases },
        { data: dependencies },
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('project_id', projectId),
        supabase.from('phases').select('*').eq('project_id', projectId),
        supabase.from('task_dependencies').select('*').eq('project_id', projectId),
      ]);

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
      const blockedTasks = tasks?.filter(t => t.status === 'blocked').length || 0;
      const notStartedTasks = tasks?.filter(t => t.status === 'not_started').length || 0;

      const totalXP = tasks?.reduce((sum, t) => sum + (t.xp || 0), 0) || 0;
      const earnedXP = tasks?.filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.xp || 0), 0) || 0;

      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Group tasks by difficulty
      const easyTasks = tasks?.filter(t => t.difficulty === 'easy').length || 0;
      const mediumTasks = tasks?.filter(t => t.difficulty === 'medium').length || 0;
      const hardTasks = tasks?.filter(t => t.difficulty === 'hard').length || 0;
      const expertTasks = tasks?.filter(t => t.difficulty === 'expert').length || 0;

      return {
        success: true,
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks,
          notStartedTasks,
          totalXP,
          earnedXP,
          progress,
          totalPhases: phases?.length || 0,
          totalDependencies: dependencies?.length || 0,
          tasksByDifficulty: {
            easy: easyTasks,
            medium: mediumTasks,
            hard: hardTasks,
            expert: expertTasks,
          },
        },
        message: `📊 إحصائيات المشروع: ${completedTasks}/${totalTasks} مهمة مكتملة (${progress}%)، ${earnedXP}/${totalXP} XP`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في جلب الإحصائيات',
      };
    }
  },
});

export const searchTasksTool = tool({
  description: 'Search for tasks by name, status, difficulty, or phase. Useful for finding specific tasks.',
  parameters: z.object({
    projectId: z.number().describe('The project ID'),
    query: z.string().optional().describe('Search query for task name'),
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).optional().describe('Filter by status'),
    difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional().describe('Filter by difficulty'),
    phaseId: z.number().optional().describe('Filter by phase ID'),
  }),
  execute: async ({ projectId, query, status, difficulty, phaseId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'غير مصرح' };
      }

      let queryBuilder = supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);

      if (query) {
        queryBuilder = queryBuilder.ilike('name', `%${query}%`);
      }

      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }

      if (difficulty) {
        queryBuilder = queryBuilder.eq('difficulty', difficulty);
      }

      if (phaseId !== undefined) {
        queryBuilder = queryBuilder.eq('phase_id', phaseId);
      }

      const { data: tasks, error } = await queryBuilder.order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        tasks,
        count: tasks?.length || 0,
        message: `تم العثور على ${tasks?.length || 0} مهمة`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في البحث عن المهام',
      };
    }
  },
});

export const getBlockedTasksTool = tool({
  description: 'Get all blocked tasks and identify what they are waiting for (their dependencies).',
  parameters: z.object({
    projectId: z.number().describe('The project ID'),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'غير مصرح' };
      }

      // Get all tasks and dependencies
      const [
        { data: tasks },
        { data: dependencies },
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('project_id', projectId),
        supabase.from('task_dependencies').select('*').eq('project_id', projectId),
      ]);

      // Find tasks that are blocked by incomplete dependencies
      const blockedTasks = tasks?.filter(task => {
        const taskDeps = dependencies?.filter(d => d.task_id === task.id) || [];
        const hasIncompleteDeps = taskDeps.some(dep => {
          const predecessor = tasks?.find(t => t.id === dep.predecessor_task_id);
          return predecessor && predecessor.status !== 'completed';
        });
        return hasIncompleteDeps || task.status === 'blocked';
      }) || [];

      // Build detailed info about what each task is waiting for
      const blockedInfo = blockedTasks.map(task => {
        const taskDeps = dependencies?.filter(d => d.task_id === task.id) || [];
        const waitingFor = taskDeps
          .map(dep => {
            const predecessor = tasks?.find(t => t.id === dep.predecessor_task_id);
            return predecessor ? `${predecessor.name} (${predecessor.status})` : null;
          })
          .filter(Boolean);

        return {
          task,
          waitingFor,
        };
      });

      return {
        success: true,
        blockedTasks: blockedInfo,
        count: blockedTasks.length,
        message: `تم العثور على ${blockedTasks.length} مهمة محظورة`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في جلب المهام المحظورة',
      };
    }
  },
});

/**
 * All tools combined for easy export
 */
export const alMurshidTools = {
  // Read tools
  getTasks: getTasksTool,
  getPhases: getPhasesTool,
  getTaskDetails: getTaskDetailsTool,
  getProjectStats: getProjectStatsTool,
  searchTasks: searchTasksTool,
  getBlockedTasks: getBlockedTasksTool,
  
  // Write tools
  createTask: createTaskTool,
  updateTask: updateTaskTool,
  deleteTask: deleteTaskTool,
  createPhase: createPhaseTool,
  updatePhase: updatePhaseTool,
  deletePhase: deletePhaseTool,
  addDependency: addDependencyTool,
  removeDependency: removeDependencyTool,
};
