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
      "breif, prompt, user_id"
    );

    if (error || !project) {
      console.error("Error fetching brief:", error);
      return null;
    }

    return { breif: project.breif, prompt: project.prompt };
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
    // Verify user owns the project
    const { project, error: accessError } = await fetchProjectForUser(
      supabase,
      user.id,
      projectId,
      "id, user_id"
    );

    if (!project || accessError || project.user_id !== user.id) {
      return { error: "Project not found or unauthorized" };
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({ breif: brief })
      .eq("id", projectId)
      .eq("user_id", user.id);

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
    // Verify user owns the project
    const { project, error: accessError } = await fetchProjectForUser(
      supabase,
      user.id,
      projectId,
      "id, user_id"
    );

    if (!project || accessError || project.user_id !== user.id) {
      return { error: "Project not found or unauthorized" };
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({ prompt })
      .eq("id", projectId)
      .eq("user_id", user.id);

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
