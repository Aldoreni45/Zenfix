import { NextRequest, NextResponse } from 'next/server';
import { VideoStageModel } from '@/lib/mongodb/models/video-protocol';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      // Get all stages for user and filter in JS since MongoDB query with $in has type issues
      const allStages = await VideoStageModel.findAll({
        assigned_to_id: user.userId,
      });
      const stages = allStages.filter(s => s.status === 'not_started' || s.status === 'in_progress');

      // Enrich with video and client info
      const enrichedStages = await Promise.all(
        stages.map(async (stage) => {
          // TODO: Enrich with video and client information
          return stage;
        })
      );

      return NextResponse.json(enrichedStages);
    } catch (error) {
      console.error('Error fetching my stage tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch my stage tasks' },
        { status: 500 }
      );
    }
  })(request);
}
