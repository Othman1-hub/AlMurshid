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
        display_name: fullName,
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

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();
  return profile;
}

export async function getUserDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }
  //update the last_active_at field
  await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", user.id);
  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const totalXp = Number(profile?.total_xp ?? 0);
  const level = profile?.level ?? Math.floor(totalXp / 1000) + 1;
  const username =
    profile?.username ||
    (user.user_metadata as any)?.display_name ||
    user.email?.split("@")?.[0] ||
    "User";

  // Fetch achievements via user_achievements join
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id, earned_at, achievement:achievements(*)")
    .eq("user_id", user.id);

  const achievements =
    userAchievements?.map((ua) => {
      const achievement = Array.isArray(ua.achievement)
        ? ua.achievement[0]
        : ua.achievement;
      return {
        id: achievement?.id ?? ua.achievement_id,
        name: achievement?.name ?? "Achievement",
        description: achievement?.description ?? "",
        icon_slug: achievement?.icon_slug ?? null,
        xp_reward: achievement?.xp_reward ?? null,
        active: true,
        earned_at: ua.earned_at,
      };
    }) ?? [];

  // Fetch user-owned projects
  const { data: ownedProjects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id);

  // Fetch projects where user is a teammate
  const { data: teamMemberships } = await supabase
    .from("teams")
    .select(
      `
        project:projects (
          id,
          name,
          description,
          created_at,
          user_id,
          password
        )
      `
    )
    .eq("user_id", user.id);

  const teamProjects =
    teamMemberships
      ?.map((m: any) => m.project)
      ?.filter(Boolean) || [];

  // Merge owned + team projects, unique by id
  const projectMap = new Map<string, any>();
  (ownedProjects || []).forEach((p: any) => projectMap.set(String(p.id), p));
  teamProjects.forEach((p: any) => projectMap.set(String(p.id), p));
  const projects = Array.from(projectMap.values());

  // Fetch tasks for all user projects with counts
  const projectIds = projects?.map((p) => p.id) || [];
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
    projects: (projects || []).map((proj) => {
      const projTasks = tasksData.filter((t) => t.project_id === proj.id);
      const completedTasks = projTasks.filter(
        (t) => t.status === "completed"
      ).length;
      const progress =
        projTasks.length > 0
          ? Math.round((completedTasks / projTasks.length) * 100)
          : 0;
      const totalXp = projTasks.reduce((sum, t) => sum + (t.xp || 0), 0);

      return {
        id: proj.id.toString(),
        name: proj.name,
        password: proj.password ?? null,
        description: proj.description,
        status: "Active",
        eta: "TBD",
        tasks: projTasks.length,
        progress,
        xpReward: totalXp,
        created_at: proj.created_at,
      };
    }),
    stats: {
      totalXp,
      level,
      username,
      streak: (profile as any)?.current_streak ?? 0,
      userProfilePicture: profile?.avatar_url || null,
    },
    taskSummary: {
      total: tasksData.length,
      completed: tasksData.filter((t) => t.status === "completed").length,
    },
    achievements: achievements || [],
  };
}
