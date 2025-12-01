/**
 * AI Tool definitions for Al-Murshid assistant
 * Direct database access - optimized for speed and reliability
 * All tools communicate directly with Supabase without middleware
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

/**
 * Task Management Tools
 */

export const createTaskTool = tool({
  description: 'Create a new task. Fast direct database insert.',
  parameters: z.object({
    projectId: z.number(),
    name: z.string(),
    description: z.string(),
    xp: z.number().min(10).max(500),
    difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
    timeEstimate: z.number().min(0.5).max(40),
    tools: z.array(z.string()).optional(),
    hints: z.array(z.string()).optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).default('not_started').optional(),
    phaseId: z.number().nullable().optional(),
  }),
  execute: async ({ projectId, name, description, xp, difficulty, timeEstimate, tools, hints, status, phaseId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      // Get max pr_id for this project
      const { data: existing } = await supabase
        .from('tasks')
        .select('pr_id')
        .eq('project_id', projectId)
        .order('pr_id', { ascending: false })
        .limit(1);
      
      const prId = existing && existing.length > 0 ? existing[0].pr_id + 1 : 1;

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          pr_id: prId,
          name,
          description,
          xp,
          difficulty,
          time_estimate: timeEstimate,
          tools: tools ? JSON.stringify(tools) : null,
          hints: hints ? JSON.stringify(hints) : null,
          status: status || 'not_started',
          phase_id: phaseId || null,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, task, message: `✅ Created task "${name}" (${xp} XP)` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const updateTaskTool = tool({
  description: 'Update task properties. Fast direct update.',
  parameters: z.object({
    taskId: z.number(),
    projectId: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    xp: z.number().min(10).max(500).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional(),
    timeEstimate: z.number().min(0.5).max(40).optional(),
    tools: z.array(z.string()).optional(),
    hints: z.array(z.string()).optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).optional(),
    phaseId: z.number().nullable().optional(),
  }),
  execute: async ({ taskId, projectId, timeEstimate, phaseId, tools, hints, ...updates }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const updateData: any = { ...updates };
      if (timeEstimate !== undefined) updateData.time_estimate = timeEstimate;
      if (phaseId !== undefined) updateData.phase_id = phaseId;
      if (tools !== undefined) updateData.tools = JSON.stringify(tools);
      if (hints !== undefined) updateData.hints = JSON.stringify(hints);

      const { data: task, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('project_id', projectId)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, task, message: `✅ Updated task successfully` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const deleteTaskTool = tool({
  description: 'Delete a task. Fast direct deletion.',
  parameters: z.object({
    taskId: z.number(),
    projectId: z.number(),
  }),
  execute: async ({ taskId, projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('project_id', projectId);

      if (error) return { success: false, error: error.message };
      return { success: true, message: `✅ Deleted task successfully` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

/**
 * Phase Management Tools - Direct DB Access
 */

export const createPhaseTool = tool({
  description: 'Create a new phase. Fast direct insert.',
  parameters: z.object({
    projectId: z.number(),
    name: z.string(),
    description: z.string(),
    orderIndex: z.number(),
  }),
  execute: async ({ projectId, name, description, orderIndex }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      // Get max pr_id
      const { data: existing } = await supabase
        .from('phases')
        .select('pr_id')
        .eq('project_id', projectId)
        .order('pr_id', { ascending: false })
        .limit(1);
      
      const prId = existing && existing.length > 0 ? existing[0].pr_id + 1 : 1;

      const { data: phase, error } = await supabase
        .from('phases')
        .insert({
          project_id: projectId,
          pr_id: prId,
          name,
          description,
          order_index: orderIndex,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, phase, message: `✅ Created phase "${name}"` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const updatePhaseTool = tool({
  description: 'Update phase. Fast direct update.',
  parameters: z.object({
    phaseId: z.number(),
    projectId: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    orderIndex: z.number().optional(),
  }),
  execute: async ({ phaseId, projectId, orderIndex, ...updates }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const updateData: any = { ...updates };
      if (orderIndex !== undefined) updateData.order_index = orderIndex;

      const { data: phase, error } = await supabase
        .from('phases')
        .update(updateData)
        .eq('id', phaseId)
        .eq('project_id', projectId)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, phase, message: `✅ Updated phase` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const deletePhaseTool = tool({
  description: 'Delete phase. Fast direct deletion.',
  parameters: z.object({
    phaseId: z.number(),
    projectId: z.number(),
  }),
  execute: async ({ phaseId, projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { error } = await supabase
        .from('phases')
        .delete()
        .eq('id', phaseId)
        .eq('project_id', projectId);

      if (error) return { success: false, error: error.message };
      return { success: true, message: `✅ Deleted phase` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

/**
 * Dependency Management Tools - Direct DB Access
 */

export const addDependencyTool = tool({
  description: 'Add task dependency. Fast direct insert.',
  parameters: z.object({
    taskId: z.number(),
    predecessorTaskId: z.number(),
    projectId: z.number(),
  }),
  execute: async ({ taskId, predecessorTaskId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data: dependency, error } = await supabase
        .from('task_dependencies')
        .insert({
          task_id: taskId,
          predecessor_task_id: predecessorTaskId,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, dependency, message: `✅ Added dependency` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const removeDependencyTool = tool({
  description: 'Remove task dependency. Fast direct deletion.',
  parameters: z.object({
    dependencyId: z.number(),
    projectId: z.number(),
  }),
  execute: async ({ dependencyId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) return { success: false, error: error.message };
      return { success: true, message: `✅ Removed dependency` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

/**
 * Collaboration & Team Management Tools
 */

export const getTeammatesTool = tool({
  description: 'Get all teammates in the project with their roles and details. Use this to see who can be assigned to tasks.',
  parameters: z.object({
    projectId: z.number(),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      // Get project owner
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return { success: false, error: 'Project not found' };
      }

      // Get team members
      const { data: teamMembers, error: teamError } = await supabase
        .from('teams')
        .select('id, user_id, role, joined_at')
        .eq('project_id', projectId);

      if (teamError) {
        return { success: false, error: `Teams query failed: ${teamError.message}` };
      }

      // Get all user IDs to fetch profiles
      const userIds = [project.user_id, ...(teamMembers || []).map(m => m.user_id)];
      
      // Get all profiles in one query
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, total_xp')
        .in('id', userIds);

      if (profileError) {
        return { success: false, error: `Profiles query failed: ${profileError.message}` };
      }

      // Create a map for quick profile lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Build teammates list
      const ownerProfile = profileMap.get(project.user_id);
      const teammates = [
        ...(ownerProfile ? [{
          user_id: ownerProfile.id,
          username: ownerProfile.username,
          role: 1,
          role_name: 'Owner',
          level: ownerProfile.level,
          total_xp: ownerProfile.total_xp,
          avatar_url: ownerProfile.avatar_url,
        }] : []),
        ...(teamMembers || []).map(member => {
          const profile = profileMap.get(member.user_id);
          return {
            user_id: member.user_id,
            username: profile?.username || 'Unknown',
            role: member.role,
            role_name: member.role === 2 ? 'Contributor' : 'Viewer',
            level: profile?.level || 1,
            total_xp: profile?.total_xp || 0,
            avatar_url: profile?.avatar_url,
            joined_at: member.joined_at,
          };
        }),
      ];

      return { 
        success: true, 
        teammates, 
        count: teammates.length,
        message: `👥 Found ${teammates.length} teammate${teammates.length !== 1 ? 's' : ''}: ${teammates.map(t => `${t.username} (${t.role_name})`).join(', ')}` 
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get teammates' };
    }
  },
});

export const assignTaskToTeammateTool = tool({
  description: 'Assign a task to a teammate. Use getTeammates first to see available team members. Provide their user_id to assign.',
  parameters: z.object({
    projectId: z.number(),
    taskId: z.number(),
    userId: z.string().describe('The user_id (UUID) of the teammate to assign the task to'),
  }),
  execute: async ({ projectId, taskId, userId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      // Verify the user is part of the project
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      const { data: teamMember } = await supabase
        .from('teams')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!teamMember && project?.user_id !== userId) {
        return { success: false, error: 'User is not a member of this project' };
      }

      // Get teammate name
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      // Assign task
      const { data: task, error } = await supabase
        .from('tasks')
        .update({ assigned_to: userId })
        .eq('id', taskId)
        .eq('project_id', projectId)
        .select('id, name')
        .single();

      if (error) return { success: false, error: error.message };
      
      return { 
        success: true, 
        task, 
        assigned_to: profile?.username,
        message: `✅ Assigned task "${task.name}" to ${profile?.username || 'teammate'}` 
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const unassignTaskTool = tool({
  description: 'Remove task assignment, making it unassigned.',
  parameters: z.object({
    projectId: z.number(),
    taskId: z.number(),
  }),
  execute: async ({ projectId, taskId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data: task, error } = await supabase
        .from('tasks')
        .update({ assigned_to: null })
        .eq('id', taskId)
        .eq('project_id', projectId)
        .select('id, name')
        .single();

      if (error) return { success: false, error: error.message };
      
      return { 
        success: true, 
        task,
        message: `✅ Unassigned task "${task.name}"` 
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const getAssignedTasksTool = tool({
  description: 'Get tasks assigned to a specific teammate or see all task assignments.',
  parameters: z.object({
    projectId: z.number(),
    userId: z.string().optional().describe('Optional: filter by specific user_id'),
  }),
  execute: async ({ projectId, userId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      let query = supabase
        .from('tasks')
        .select('id, pr_id, name, status, difficulty, xp, assigned_to')
        .eq('project_id', projectId)
        .not('assigned_to', 'is', null);

      if (userId) {
        query = query.eq('assigned_to', userId);
      }

      const { data: tasks, error } = await query.order('pr_id', { ascending: true });

      if (error) return { success: false, error: error.message };

      // Get unique assigned user IDs
      const assignedUserIds = [...new Set((tasks || [])
        .map(t => t.assigned_to)
        .filter(Boolean))] as string[];
      
      // Fetch profiles for assigned users
      let profileMap = new Map();
      if (assignedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, level')
          .in('id', assignedUserIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, { username: p.username, level: p.level }]) || []);
      }

      const formattedTasks = (tasks || []).map((task: any) => {
        const profile = task.assigned_to ? profileMap.get(task.assigned_to) : null;
        return {
          id: task.id,
          pr_id: task.pr_id,
          name: task.name,
          status: task.status,
          difficulty: task.difficulty,
          xp: task.xp,
          assigned_to: profile?.username || 'Unknown',
          assigned_to_level: profile?.level || 1,
        };
      });

      return { 
        success: true, 
        tasks: formattedTasks, 
        count: formattedTasks.length,
        message: userId 
          ? `📋 Found ${formattedTasks.length} assigned tasks`
          : `📋 Found ${formattedTasks.length} assigned tasks across team`
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

/**
 * Data Reading Tools - Direct DB Access (Optimized)
 */

export const getTasksTool = tool({
  description: 'Get all tasks with full details including assignment info.',
  parameters: z.object({
    projectId: z.number(),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          id, 
          pr_id, 
          name, 
          description, 
          status, 
          difficulty, 
          xp, 
          time_estimate, 
          phase_id, 
          tools, 
          hints,
          assigned_to
        `)
        .eq('project_id', projectId)
        .order('pr_id', { ascending: true });

      if (error) return { success: false, error: error.message };
      
      // Get unique assigned user IDs
      const assignedUserIds = [...new Set((tasks || [])
        .map(t => t.assigned_to)
        .filter(Boolean))] as string[];
      
      // Fetch profiles for assigned users
      let profileMap = new Map();
      if (assignedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', assignedUserIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);
      }
      
      const formattedTasks = (tasks || []).map((task: any) => ({
        ...task,
        assigned_to_name: task.assigned_to ? profileMap.get(task.assigned_to) || null : null,
      }));
      
      return { success: true, tasks: formattedTasks, count: formattedTasks?.length || 0 };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const getPhasesTool = tool({
  description: 'Get all phases with details.',
  parameters: z.object({
    projectId: z.number(),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data: phases, error } = await supabase
        .from('phases')
        .select('id, pr_id, name, description, order_index')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) return { success: false, error: error.message };
      return { success: true, phases, count: phases?.length || 0 };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const getTaskDetailsTool = tool({
  description: 'Get specific task details with dependencies.',
  parameters: z.object({
    projectId: z.number(),
    taskId: z.number(),
  }),
  execute: async ({ projectId, taskId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const [taskResult, depsResult] = await Promise.all([
        supabase.from('tasks').select('*').eq('id', taskId).eq('project_id', projectId).single(),
        supabase.from('task_dependencies').select('id, predecessor_task_id').eq('task_id', taskId),
      ]);

      if (taskResult.error) return { success: false, error: taskResult.error.message };
      return { success: true, task: taskResult.data, dependencies: depsResult.data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const getProjectStatsTool = tool({
  description: 'Get project stats: tasks, XP, progress, phases.',
  parameters: z.object({
    projectId: z.number(),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const [tasksRes, phasesRes, depsRes] = await Promise.all([
        supabase.from('tasks').select('status, xp, difficulty').eq('project_id', projectId),
        supabase.from('phases').select('id').eq('project_id', projectId),
        supabase.from('task_dependencies').select('id').eq('project_id', projectId),
      ]);

      const tasks = tasksRes.data || [];
      const totalTasks = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const totalXP = tasks.reduce((sum, t) => sum + (t.xp || 0), 0);
      const earnedXP = tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.xp || 0), 0);
      const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      return {
        success: true,
        stats: {
          totalTasks,
          completed,
          inProgress,
          notStarted: tasks.filter(t => t.status === 'not_started').length,
          blocked: tasks.filter(t => t.status === 'blocked').length,
          totalXP,
          earnedXP,
          progress,
          phases: phasesRes.data?.length || 0,
          dependencies: depsRes.data?.length || 0,
        },
        message: `📊 ${completed}/${totalTasks} tasks (${progress}%), ${earnedXP}/${totalXP} XP`,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const searchTasksTool = tool({
  description: 'Search/filter tasks by name, status, difficulty, or phase.',
  parameters: z.object({
    projectId: z.number(),
    query: z.string().optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional(),
    phaseId: z.number().optional(),
  }),
  execute: async ({ projectId, query, status, difficulty, phaseId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      let qb = supabase.from('tasks').select('id, pr_id, name, status, difficulty, xp, phase_id').eq('project_id', projectId);
      if (query) qb = qb.ilike('name', `%${query}%`);
      if (status) qb = qb.eq('status', status);
      if (difficulty) qb = qb.eq('difficulty', difficulty);
      if (phaseId !== undefined) qb = qb.eq('phase_id', phaseId);

      const { data: tasks, error } = await qb.order('pr_id', { ascending: true });
      if (error) return { success: false, error: error.message };
      return { success: true, tasks, count: tasks?.length || 0 };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const getBlockedTasksTool = tool({
  description: 'Get blocked tasks with their incomplete dependencies.',
  parameters: z.object({
    projectId: z.number(),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const [tasksRes, depsRes] = await Promise.all([
        supabase.from('tasks').select('id, name, status').eq('project_id', projectId),
        supabase.from('task_dependencies').select('task_id, predecessor_task_id'),
      ]);

      const tasks = tasksRes.data || [];
      const deps = depsRes.data || [];

      const blocked = tasks.filter(task => {
        const taskDeps = deps.filter(d => d.task_id === task.id);
        return taskDeps.some(dep => {
          const pred = tasks.find(t => t.id === dep.predecessor_task_id);
          return pred && pred.status !== 'completed';
        }) || task.status === 'blocked';
      });

      const result = blocked.map(task => ({
        task,
        waitingFor: deps.filter(d => d.task_id === task.id).map(d => tasks.find(t => t.id === d.predecessor_task_id)?.name).filter(Boolean),
      }));

      return { success: true, blockedTasks: result, count: blocked.length };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

/**
 * Project Brief & Memory Management Tools - Direct DB Access
 */

export const getProjectBriefTool = tool({
  description: 'Get project brief, description, and AI prompt.',
  parameters: z.object({
    projectId: z.number(),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data: project, error } = await supabase
        .from('projects')
        .select('id, name, description, breif, prompt')
        .eq('id', projectId)
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, project };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const updateProjectBriefTool = tool({
  description: 'Update project brief, description, or AI prompt.',
  parameters: z.object({
    projectId: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    breif: z.string().optional(),
    prompt: z.string().optional(),
  }),
  execute: async ({ projectId, ...updates }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data: project, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, project, message: '✅ Updated project brief' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const getMemoryTool = tool({
  description: 'Get project memory items (constants, fragments, external_resources).',
  parameters: z.object({
    projectId: z.number(),
    type: z.enum(['constants', 'fragments', 'external_resources']).optional(),
  }),
  execute: async ({ projectId, type }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      let query = supabase
        .from('memory')
        .select('id, type, label, content, description, meta_data')
        .eq('project_id', projectId);
      
      if (type) query = query.eq('type', type);

      const { data: memory, error } = await query.order('created_at', { ascending: true });

      if (error) return { success: false, error: error.message };
      return { success: true, memory, count: memory?.length || 0 };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const createMemoryTool = tool({
  description: 'Create memory item (constant, fragment, or external resource).',
  parameters: z.object({
    projectId: z.number(),
    type: z.enum(['constants', 'fragments', 'external_resources']),
    label: z.string(),
    content: z.string(),
    description: z.string().optional(),
    metaData: z.record(z.any()).optional(),
  }),
  execute: async ({ projectId, type, label, content, description, metaData }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data: memory, error } = await supabase
        .from('memory')
        .insert({
          project_id: projectId,
          type,
          label,
          content,
          description: description || null,
          meta_data: metaData || null,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, memory, message: `✅ Created ${type} "${label}"` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const updateMemoryTool = tool({
  description: 'Update memory item.',
  parameters: z.object({
    memoryId: z.number(),
    projectId: z.number(),
    label: z.string().optional(),
    content: z.string().optional(),
    description: z.string().optional(),
    metaData: z.record(z.any()).optional(),
  }),
  execute: async ({ memoryId, projectId, metaData, ...updates }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const updateData: any = { ...updates };
      if (metaData !== undefined) updateData.meta_data = metaData;

      const { data: memory, error } = await supabase
        .from('memory')
        .update(updateData)
        .eq('id', memoryId)
        .eq('project_id', projectId)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, memory, message: '✅ Updated memory item' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },
});

export const deleteMemoryTool = tool({
  description: 'Delete memory item.',
  parameters: z.object({
    memoryId: z.number(),
    projectId: z.number(),
  }),
  execute: async ({ memoryId, projectId }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { error } = await supabase
        .from('memory')
        .delete()
        .eq('id', memoryId)
        .eq('project_id', projectId);

      if (error) return { success: false, error: error.message };
      return { success: true, message: '✅ Deleted memory item' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
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
  getProjectBrief: getProjectBriefTool,
  getMemory: getMemoryTool,
  
  // Collaboration tools
  getTeammates: getTeammatesTool,
  assignTaskToTeammate: assignTaskToTeammateTool,
  unassignTask: unassignTaskTool,
  getAssignedTasks: getAssignedTasksTool,
  
  // Write tools
  createTask: createTaskTool,
  updateTask: updateTaskTool,
  deleteTask: deleteTaskTool,
  createPhase: createPhaseTool,
  updatePhase: updatePhaseTool,
  deletePhase: deletePhaseTool,
  addDependency: addDependencyTool,
  removeDependency: removeDependencyTool,
  updateProjectBrief: updateProjectBriefTool,
  createMemory: createMemoryTool,
  updateMemory: updateMemoryTool,
  deleteMemory: deleteMemoryTool,
};
