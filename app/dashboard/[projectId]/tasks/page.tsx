import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TaskRoadmap from '@/components/TaskRoadmap';

export default async function ProjectTasksPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const projectIdNum = Number(projectId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch project to verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectIdNum)
    .eq('user_id', user.id)
    .single();

  if (!project) {
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

  return (
    <TaskRoadmap
      projectId={projectIdNum}
      tasks={tasks}
      phases={phases}
      dependencies={dependencies}
    />
  );
}
