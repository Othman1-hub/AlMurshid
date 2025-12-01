import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchProjectForUser } from '@/lib/projectAccess';

/**
 * GET /api/projects/[projectId]/dependencies
 * 
 * Retrieves all task dependencies for a specific project
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

    const { project, error } = await fetchProjectForUser(
      supabase,
      user.id,
      projectId,
      'id'
    );

    if (!project || error) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all task IDs for this project
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId);

    if (!tasks || tasks.length === 0) {
      return Response.json([]);
    }

    const taskIds = tasks.map(t => t.id);

    // Fetch dependencies
    const { data: dependencies, error } = await supabase
      .from('task_dependencies')
      .select('*')
      .in('task_id', taskIds);

    if (error) {
      throw error;
    }

    return Response.json(dependencies || []);
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    return Response.json(
      { error: 'Failed to fetch dependencies' },
      { status: 500 }
    );
  }
}
