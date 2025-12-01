"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { TaskDifficulty, TaskStatus } from "@/lib/types/task";
import { fetchProjectForUser } from "@/lib/projectAccess";

async function ensureProjectAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: number
) {
  const { project, error } = await fetchProjectForUser(
    supabase,
    userId,
    projectId,
    "id"
  );

  if (!project || error) {
    return { error: "Project not found or unauthorized" };
  }
  return { ok: true as const };
}

/**
 * Get all tasks for a project
 */
export async function getProjectTasks(projectId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const access = await ensureProjectAccess(supabase, user.id, projectId);
    if ("error" in access) {
      return access;
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      return { error: error.message };
    }

    return { success: true, tasks: data };
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return { error: "Failed to fetch tasks" };
  }
}

/**
 * Create a new task
 */
export async function createTask(
  projectId: number,
  taskData: {
    name: string;
    description: string;
    xp: number;
    difficulty: TaskDifficulty;
    time_estimate: number;
    tools?: string;
    hints?: string;
    status?: TaskStatus;
    phase_id?: number | null;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const access = await ensureProjectAccess(supabase, user.id, projectId);
    if ("error" in access) {
      return access;
    }

    // Prepare the data for insertion
    const insertData = {
      project_id: projectId,
      name: taskData.name,
      description: taskData.description,
      xp: taskData.xp,
      difficulty: taskData.difficulty,
      time_estimate: taskData.time_estimate,
      tools: taskData.tools || null,
      hints: taskData.hints || null,
      status: taskData.status || "not_started",
      phase_id: taskData.phase_id !== undefined ? taskData.phase_id : null,
    };

    console.log('Creating task with data:', insertData);

    const { data, error } = await supabase
      .from("tasks")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating task:', error);
      return { error: error.message };
    }

    revalidatePath(`/dashboard/${projectId}`, "layout");
    return { success: true, task: data };
  } catch (err) {
    console.error("Error creating task:", err);
    return { error: "Failed to create task" };
  }
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: number,
  projectId: number,
  updates: {
    name?: string;
    description?: string;
    xp?: number;
    difficulty?: TaskDifficulty;
    time_estimate?: number;
    tools?: string;
    hints?: string;
    status?: TaskStatus;
    phase_id?: number | null;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const access = await ensureProjectAccess(supabase, user.id, projectId);
    if ("error" in access) {
      return access;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/${projectId}`, "layout");
    return { success: true, task: data };
  } catch (err) {
    console.error("Error updating task:", err);
    return { error: "Failed to update task" };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number, projectId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const access = await ensureProjectAccess(supabase, user.id, projectId);
    if ("error" in access) {
      return access;
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("project_id", projectId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/${projectId}`, "layout");
    return { success: true };
  } catch (err) {
    console.error("Error deleting task:", err);
    return { error: "Failed to delete task" };
  }
}

/**
 * Bulk insert tasks (used when generating plan)
 */
export async function bulkCreateTasks(
  projectId: number,
  tasks: Array<{
    name: string;
    description: string;
    xp: number;
    difficulty: TaskDifficulty;
    time_estimate: number;
    tools?: string;
    hints?: string;
    status?: TaskStatus;
    phase_id?: number | null;
  }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const access = await ensureProjectAccess(supabase, user.id, projectId);
    if ("error" in access) {
      return access;
    }

    const tasksToInsert = tasks.map(task => ({
      project_id: projectId,
      name: task.name,
      description: task.description,
      xp: task.xp,
      difficulty: task.difficulty,
      time_estimate: task.time_estimate,
      tools: task.tools || null,
      hints: task.hints || null,
      status: task.status || "not_started",
      phase_id: task.phase_id || null,
    }));

    const { data, error } = await supabase
      .from("tasks")
      .insert(tasksToInsert)
      .select();

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/${projectId}`, "layout");
    return { success: true, tasks: data };
  } catch (err) {
    console.error("Error bulk creating tasks:", err);
    return { error: "Failed to create tasks" };
  }
}
