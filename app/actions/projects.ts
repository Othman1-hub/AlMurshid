"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

type FormState = {
  error?: string;
  success?: boolean;
  values: {
    name?: string;
    description?: string;
    collaboration_password?: string;
  };
  project?: any;
};

const initialState: FormState = {
  error: undefined,
  success: undefined,
  values: {
    name: undefined,
    description: undefined,
    collaboration_password: undefined,
  },
};

export async function addProject(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { 
      error: "User not authenticated", 
      values: { 
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        collaboration_password: formData.get("collaboration_password") as string,
      } 
    };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const collaboration_password = formData.get("collaboration_password") as string;

  if (!name?.trim()) {
    return { 
      error: "Project name is required", 
      values: { name, description, collaboration_password } 
    };
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          user_id: user.id,
          name: name.trim(),
          description: description?.trim() || null,
          password: collaboration_password?.trim() || null,
        },
      ])
      .select();

    if (error) {
      return { 
        error: error.message, 
        values: { name, description, collaboration_password } 
      };
    }

    revalidatePath("/dashboard", "layout");
    return { 
      success: true, 
      values: { name, description, collaboration_password },
      project: data?.[0] 
    };
  } catch (err) {
    console.error("Error adding project:", err);
    return { 
      error: "Failed to add project", 
      values: { name, description, collaboration_password } 
    };
  }
}

export async function updateProject(
  projectId: number,
  prevState: any,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated", values: {} };
  }

  const name = formData.get("name") as string;

  if (!name?.trim()) {
    return { error: "Project name is required", values: { name } };
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .update({ name: name.trim() })
      .eq("id", projectId)
      .eq("user_id", user.id)
      .select();

    if (error) {
      return { error: error.message, values: { name } };
    }

    revalidatePath("/dashboard", "layout");
    return { success: true, project: data?.[0] };
  } catch (err) {
    console.error("Error updating project:", err);
    return { error: "Failed to update project", values: { name } };
  }
}

export async function deleteProject(projectId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (err) {
    console.error("Error deleting project:", err);
    return { error: "Failed to delete project" };
  }
}
