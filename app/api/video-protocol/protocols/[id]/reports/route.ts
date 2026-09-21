import { NextRequest, NextResponse } from 'next/server';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { requireOwnerOrManager } from '@/lib/auth/middleware';
import { loadProtocolContent } from '@/lib/api-helpers/video-protocol';
import { isOverdueByDate } from '@/lib/date-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const { id } = await params;
      const protocolId = parseInt(id);

      const protocol = await VideoProtocolModel.findByNumericId(protocolId);
      if (!protocol) {
        return NextResponse.json(
          { error: 'Protocol not found' },
          { status: 404 }
        );
      }

      const { stageDocs, summaries } = await loadProtocolContent(protocol);

      const stage_breakdown: Record<string, { completed: number; total: number }> = {};
      stageDocs.forEach((s) => {
        const key = s.stage_type;
        if (!stage_breakdown[key]) stage_breakdown[key] = { completed: 0, total: 0 };
        stage_breakdown[key].total += 1;
        if (s.status === 'completed') stage_breakdown[key].completed += 1;
      });

      const posted = summaries.filter((s) => s.current_status === 'posted').length;
      const inProgress = summaries.filter((s) => s.current_status === 'in_progress').length;
      const notStarted = summaries.filter((s) => s.current_status === 'not_started').length;
      const blocked = stageDocs.filter((s) => s.status === 'blocked').length;
      const overdue = stageDocs.filter((s) => s.status !== 'completed' && s.due_date && isOverdueByDate(s.due_date)).length;

      const report = {
        protocol: {
          numeric_id: protocol.numeric_id,
          client_name: protocol.client_name,
          month: protocol.month,
          year: protocol.year,
          target_videos: protocol.target_videos,
        },
        summary: {
          target: protocol.target_videos,
          posted,
          in_progress: inProgress,
          not_started: notStarted,
          workflow_progress: protocol.workflow_progress,
          fully_completed: protocol.fully_completed_videos,
          total_stages: protocol.total_stages,
          completed_stages: protocol.completed_stages,
          blocked_stages: blocked,
          overdue_stages: overdue,
        },
        stage_breakdown,
        videos: summaries,
      };

      return NextResponse.json(report);
    } catch (error) {
      console.error('Error fetching protocol reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch protocol reports' },
        { status: 500 }
      );
    }
  })(request);
}