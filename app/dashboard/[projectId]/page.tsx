import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { fetchProjectForUser } from '@/lib/projectAccess';

export default async function ProjectDefault({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const projectIdNum = parseInt(projectId);

  if (isNaN(projectIdNum)) {
    redirect('/dashboard');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { project, error } = await fetchProjectForUser(
    supabase,
    user.id,
    projectIdNum,
    'generate, user_id'
  );

  if (!project || error) {
    redirect('/dashboard');
  }

  // If not generated yet, redirect to generate page
  if (project.generate !== true) {
    redirect(`/dashboard/${projectId}/generate`);
  }

  // If generated, redirect to AI page
  redirect(`/dashboard/${projectId}/ai`);
}
