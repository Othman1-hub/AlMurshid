"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProjectBrief(projectId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("breif, prompt")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching brief:", error);
      return null;
    }

    return data;
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
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return { error: "Project not found or unauthorized" };
    }

    const { error } = await supabase
      .from("projects")
      .update({ breif: brief })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      return { error: error.message };
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
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return { error: "Project not found or unauthorized" };
    }

    const { error } = await supabase
      .from("projects")
      .update({ prompt })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/${projectId}/brief`, "page");
    return { success: true };
  } catch (err) {
    console.error("Error updating prompt:", err);
    return { error: "Failed to update prompt" };
  }
}
