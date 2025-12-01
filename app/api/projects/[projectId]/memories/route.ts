import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchProjectForUser } from '@/lib/projectAccess';

/**
 * GET /api/projects/[projectId]/memories
 * 
 * Retrieves all memory items (constants, fragments) for a specific project
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

    const { project, error: accessError } = await fetchProjectForUser(
      supabase,
      user.id,
      projectId,
      'id'
    );

    if (!project || accessError) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch memories
    const { data: memories, error: memoriesError } = await supabase
      .from('memory')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (memoriesError) {
      throw memoriesError;
    }

    return Response.json(memories || []);
  } catch (error) {
    console.error('Error fetching memories:', error);
    return Response.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}
