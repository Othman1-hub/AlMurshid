import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TaskRoadmap from '@/components/TaskRoadmap';
import { fetchProjectForUser } from '@/lib/projectAccess';

export default async function ProjectTasksPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const projectIdNum = Number(projectId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { project, error } = await fetchProjectForUser(
    supabase,
    user.id,
    projectIdNum,
    'id'
  );

  if (!project || error) {
    redirect('/dashboard');
  }

  // Fetch all data
  const [tasksResult, phasesResult, depsResult] = await Promise.all([
    supabase.from('tasks').select('*').eq('project_id', projectIdNum).order('created_at'),
    supabase.from('phases').select('*').eq('project_id', projectIdNum).order('order_index'),
    supabase.from('task_dependencies').select('*').in(
      'task_id',
      (await supabase.from('tasks').select('id').eq('project_id', projectIdNum)).data?.map((t) => t.id) ||
        [],
    ),
  ]);

  const tasks = tasksResult.data || [];
  const phases = phasesResult.data || [];
  const dependencies = depsResult.data || [];
  // Fetch teammates (including owner) and resolve usernames via profiles to avoid RLS join issues
  const { data: teamRows } = await supabase
    .from('teams')
    .select('user_id')
    .eq('project_id', projectIdNum);

  const { data: projectOwner } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectIdNum)
    .maybeSingle();

  const userIds = Array.from(
    new Set([
      ...(projectOwner?.user_id ? [projectOwner.user_id] : []),
      ...((teamRows || []).map((row: any) => row.user_id) as string[]),
    ])
  );

  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, username').in('id', userIds)
    : { data: [] };

  const profileMap = new Map<string, string>();
  (profiles || []).forEach((p: any) => profileMap.set(p.id, p.username || 'Teammate'));

  const teammates = userIds.map((id) => ({
    id,
    name: profileMap.get(id) || 'Teammate',
  }));

  const { data: selfTeam } = await supabase
    .from('teams')
    .select('role')
    .eq('project_id', projectIdNum)
    .eq('user_id', user.id)
    .maybeSingle();

  const isOwner = projectOwner?.user_id === user.id;
  const currentUserRole = isOwner ? 1 : selfTeam?.role ?? 2;

  return (
    <TaskRoadmap
      projectId={projectIdNum}
      tasks={tasks}
      phases={phases}
      dependencies={dependencies}
      teammates={teammates}
      currentUserRole={currentUserRole}
    />
  );
}
