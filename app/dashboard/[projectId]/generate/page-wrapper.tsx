import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import GeneratePageClient from './generate-client';
import { fetchProjectForUser } from '@/lib/projectAccess';

export default async function ProjectFirstGeneratePage({ params }: { params: { projectId: string } }) {
  const projectId = parseInt(params.projectId);
  
  if (isNaN(projectId)) {
    redirect('/dashboard');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check if user owns or is a teammate, and if it's already been generated
  const { project, error } = await fetchProjectForUser(
    supabase,
    user.id,
    projectId,
    'id, name, generate'
  );

  if (error || !project) {
    redirect('/dashboard');
  }

  // Fetch user level for display; default to 1 if missing
  const { data: profile } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', user.id)
    .single();

  const userLevel = profile?.level ?? 1;

  // If project has already been generated, redirect to main project page
  if (project.generate === true) {
    redirect(`/dashboard/${projectId}`);
  }

  return <GeneratePageClient projectId={projectId} projectName={project.name || ''} userLevel={userLevel} />;
}
