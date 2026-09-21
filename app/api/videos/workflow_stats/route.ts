import { NextRequest, NextResponse } from 'next/server';
import { VideoModel } from '@/lib/mongodb/models/video';
import { requireOwnerOrManager } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const videos = await VideoModel.findAll({});

      const stats = {
        total: videos.length,
        by_status: {
          idea: videos.filter(v => v.status === 'idea').length,
          script: videos.filter(v => v.status === 'script').length,
          shooting: videos.filter(v => v.status === 'shooting').length,
          editing: videos.filter(v => v.status === 'editing').length,
          internal_review: videos.filter(v => v.status === 'internal_review').length,
          client_review: videos.filter(v => v.status === 'client_review').length,
          approved: videos.filter(v => v.status === 'approved').length,
          posted: videos.filter(v => v.status === 'posted').length,
        },
        by_priority: {
          low: videos.filter(v => v.priority === 'low').length,
          medium: videos.filter(v => v.priority === 'medium').length,
          high: videos.filter(v => v.priority === 'high').length,
          urgent: videos.filter(v => v.priority === 'urgent').length,
        },
        overdue: videos.filter(v => v.deadline && new Date(v.deadline) < new Date()).length,
        completed_this_month: 0, // TODO: Implement based on posted_date
      };

      return NextResponse.json(stats);
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workflow stats' },
        { status: 500 }
      );
    }
  })(request);
}
