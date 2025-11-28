import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/projects/[projectId]/tasks
 * 
 * Retrieves all tasks for a specific project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId: projectIdStr } = await params;
    const projectId = parseInt(projectIdStr);
    
    if (isNaN(projectId)) {
      return Response.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return Response.json(tasks || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return Response.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
