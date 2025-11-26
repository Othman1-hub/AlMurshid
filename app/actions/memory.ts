"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type MemoryType = "constants" | "fragments" | "external_resources";

type FormState = {
  error?: string;
  success?: boolean;
  values: {
    label?: string;
    content?: string;
    description?: string;
    type?: string;
  };
  memory?: any;
};

const initialState: FormState = {
  error: undefined,
  success: undefined,
  values: {
    label: undefined,
    content: undefined,
    description: undefined,
    type: undefined,
  },
};

export async function addMemory(
  projectId: number,
  memoryType: MemoryType,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "User not authenticated",
      values: {
        label: formData.get("label") as string,
        content: formData.get("content") as string,
        description: formData.get("description") as string,
        type: memoryType,
      },
    };
  }

  // Verify user owns the project
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return {
      error: "Project not found or unauthorized",
      values: {
        label: formData.get("label") as string,
        content: formData.get("content") as string,
        description: formData.get("description") as string,
        type: memoryType,
      },
    };
  }

  const label = formData.get("label") as string;
  const content = formData.get("content") as string;
  const description = formData.get("description") as string;

  if (!label?.trim()) {
    return {
      error: "Label is required",
      values: { label, content, description, type: memoryType },
    };
  }

  if (!content?.trim()) {
    return {
      error: "Content is required",
      values: { label, content, description, type: memoryType },
    };
  }

  try {
    const { data, error } = await supabase
      .from("memory")
      .insert([
        {
          project_id: projectId,
          type: memoryType,
          label: label.trim(),
          content: content.trim(),
          description: description?.trim() || null,
          meta_data: null,
        },
      ])
      .select();

    if (error) {
      return {
        error: error.message,
        values: { label, content, description, type: memoryType },
      };
    }

    revalidatePath(`/dashboard/${projectId}/PROJECT_MEMORY`, "page");
    return {
      success: true,
      values: { label, content, description, type: memoryType },
      memory: data?.[0],
    };
  } catch (err) {
    console.error("Error adding memory:", err);
    return {
      error: "Failed to add memory item",
      values: { label, content, description, type: memoryType },
    };
  }
}

export async function getProjectMemories(projectId: number, memoryType?: MemoryType) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  try {
    let query = supabase
      .from("memory")
      .select("*")
      .eq("project_id", projectId);

    if (memoryType) {
      query = query.eq("type", memoryType);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching memories:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error in getProjectMemories:", err);
    return null;
  }
}

export async function deleteMemory(memoryId: number, projectId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

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

  try {
    const { error } = await supabase
      .from("memory")
      .delete()
      .eq("id", memoryId)
      .eq("project_id", projectId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/${projectId}/PROJECT_MEMORY`, "page");
    return { success: true };
  } catch (err) {
    console.error("Error deleting memory:", err);
    return { error: "Failed to delete memory item" };
  }
}

export async function updateMemory(
  memoryId: number,
  projectId: number,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "User not authenticated",
      values: {
        label: formData.get("label") as string,
        content: formData.get("content") as string,
        description: formData.get("description") as string,
      },
    };
  }

  // Verify user owns the project
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return {
      error: "Project not found or unauthorized",
      values: {
        label: formData.get("label") as string,
        content: formData.get("content") as string,
        description: formData.get("description") as string,
      },
    };
  }

  const label = formData.get("label") as string;
  const content = formData.get("content") as string;
  const description = formData.get("description") as string;

  if (!label?.trim()) {
    return {
      error: "Label is required",
      values: { label, content, description },
    };
  }

  if (!content?.trim()) {
    return {
      error: "Content is required",
      values: { label, content, description },
    };
  }

  try {
    const { data, error } = await supabase
      .from("memory")
      .update({
        label: label.trim(),
        content: content.trim(),
        description: description?.trim() || null,
      })
      .eq("id", memoryId)
      .eq("project_id", projectId)
      .select();

    if (error) {
      return {
        error: error.message,
        values: { label, content, description },
      };
    }

    revalidatePath(`/dashboard/${projectId}/PROJECT_MEMORY`, "page");
    return {
      success: true,
      values: { label, content, description },
      memory: data?.[0],
    };
  } catch (err) {
    console.error("Error updating memory:", err);
    return {
      error: "Failed to update memory item",
      values: { label, content, description },
    };
  }
}
