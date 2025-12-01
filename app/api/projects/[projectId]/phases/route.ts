import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchProjectForUser } from '@/lib/projectAccess';

/**
 * GET /api/projects/[projectId]/phases
 * 
 * Retrieves all phases for a specific project
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

    // Fetch phases
    const { data: phases, error: phasesError } = await supabase
      .from('phases')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (phasesError) {
      throw phasesError;
    }

    return Response.json(phases || []);
  } catch (error) {
    console.error('Error fetching phases:', error);
    return Response.json(
      { error: 'Failed to fetch phases' },
      { status: 500 }
    );
  }
}
