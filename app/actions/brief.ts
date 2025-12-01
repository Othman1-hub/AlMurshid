"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { fetchProjectForUser } from "@/lib/projectAccess";

export async function getProjectBrief(projectId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  try {
    const { project, error } = await fetchProjectForUser(
      supabase,
      user.id,
      projectId,
      "breif, prompt, user_id, teams(role)"
    );

    if (error || !project) {
      console.error("Error fetching brief:", error);
      return null;
    }

    // Determine role: owner => 1, teammate => teams.role, default 2
    const roleFromTeam =
      Array.isArray((project as any).teams) && (project as any).teams[0]
        ? (project as any).teams[0].role
        : 2;
    const role = project.user_id === user.id ? 1 : roleFromTeam ?? 2;

    return { breif: project.breif, prompt: project.prompt, role };
  } catch (err) {
    console.error("Error in getProjectBrief:", err);
    return null;
  }
}

export async function updateProjectBrief(projectId: number, brief: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const { project, error: accessError } = await fetchProjectForUser(
      supabase,
      user.id,
      projectId,
      "id, user_id"
    );

    if (!project || accessError) {
      return { error: "Project not found or unauthorized" };
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({ breif: brief })
      .eq("id", projectId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath(`/dashboard/${projectId}/brief`, "page");
    return { success: true };
  } catch (err) {
    console.error("Error updating brief:", err);
    return { error: "Failed to update brief" };
  }
}

export async function updateProjectPrompt(projectId: number, prompt: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const { project, error: accessError } = await fetchProjectForUser(
      supabase,
      user.id,
      projectId,
      "id, user_id"
    );

    if (!project || accessError) {
      return { error: "Project not found or unauthorized" };
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({ prompt })
      .eq("id", projectId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath(`/dashboard/${projectId}/brief`, "page");
    return { success: true };
  } catch (err) {
    console.error("Error updating prompt:", err);
    return { error: "Failed to update prompt" };
  }
}
