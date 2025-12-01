import { SupabaseClient } from "@supabase/supabase-js";

export type ProjectAccessResult<T = any> = {
  project: (T & { user_id: string }) | null;
  error: any;
};

/**
 * Returns the project when the user is the owner OR a teammate.
 * Uses two lightweight checks: project by id, then membership in teams.
 */
export async function fetchProjectForUser<T = any>(
  supabase: SupabaseClient,
  userId: string,
  projectId: number,
  selectFields: string = "id, user_id"
): Promise<ProjectAccessResult<T>> {
  const { data: project, error } = await supabase
    .from("projects")
    .select(selectFields)
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) {
    return { project: null, error: error || new Error("Project not found") };
  }

  if ((project as any).user_id === userId) {
    return { project: project as any, error: null };
  }

  const { data: teamRow, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (teamError || !teamRow) {
    return {
      project: null,
      error: teamError || new Error("Not authorized for this project"),
    };
  }

  return { project: project as any, error: null };
}
