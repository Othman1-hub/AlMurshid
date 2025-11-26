"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signIn(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message, values: { email: data.email } };
  }
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signUp(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const password = formData.get("password") as string;
  if (password !== confirmPassword) {
    return { error: "كلمات المرور غير متطابقة.", values: { email, fullName } };
  }
  const data = {
    email: email,
    password: password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message, values: { email, fullName } };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getUser(){
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*").eq("id", user?.id).single();
  return profile;
}

export async function getUserDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch user projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id);

  // Fetch tasks for all user projects with counts
  const projectIds = projects?.map(p => p.id) || [];
  let tasksData: any[] = [];
  
  if (projectIds.length > 0) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .in("project_id", projectIds);
    tasksData = tasks || [];
  }

  return {
    profile,
    projects: (projects || []).map(proj => {
      const projTasks = tasksData.filter(t => t.project_id === proj.id);
      const completedTasks = projTasks.filter(t => t.status === 'completed').length;
      const progress = projTasks.length > 0 ? Math.round((completedTasks / projTasks.length) * 100) : 0;
      const totalXp = projTasks.reduce((sum, t) => sum + (t.xp || 0), 0);
      
      return {
        id: proj.id.toString(),
        name: proj.name,
        description: proj.description,
        status: 'Active',
        eta: 'TBD',
        tasks: projTasks.length,
        progress,
        xpReward: totalXp,
        created_at: proj.created_at,
      };
    }),
    stats: {
      totalXp: profile?.total_xp || 0,
      level: profile?.level || 1,
      username: profile?.username || 'User',
    }
  };
}