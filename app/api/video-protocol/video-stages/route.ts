import { NextRequest, NextResponse } from 'next/server';
import { VideoStageModel } from '@/lib/mongodb/models/video-protocol';
import { requireAuth } from '@/lib/auth/middleware';
import { parseDueDateUTC } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const videoId = searchParams.get('video');

      const filters: any = {};
      if (videoId) {
        filters.video_record_id = parseInt(videoId);
      }

      const stages = await VideoStageModel.findAll(filters);
      return NextResponse.json(stages);
    } catch (error) {
      console.error('Error fetching video stages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch video stages' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { video_id, stage_type, stage_display, assigned_to, due_date } = body;

      if (!video_id || !stage_type || !stage_display) {
        return NextResponse.json(
          { error: 'video_id, stage_type, and stage_display are required' },
          { status: 400 }
        );
      }

      let parsedDueDate: Date | null = null;
      if (due_date) {
        parsedDueDate = parseDueDateUTC(due_date);
        if (!parsedDueDate) {
          return NextResponse.json(
            { error: 'Invalid due date. Use YYYY-MM-DD format.' },
            { status: 400 }
          );
        }
      }

      const stage = await VideoStageModel.create({
        video_record_id: video_id,
        stage_type,
        stage_display,
        assigned_to_id: assigned_to,
        due_date: parsedDueDate || undefined,
        status: 'not_started',
        status_display: 'Not Started',
        notes: '',
        rejection_reason: '',
        drive_link: '',
        completion_notes: '',
        instagram_url: '',
        caption: '',
        is_locked: false,
        is_overdue: false,
      });

      return NextResponse.json(stage, { status: 201 });
    } catch (error) {
      console.error('Error creating video stage:', error);
      return NextResponse.json(
        { error: 'Failed to create video stage' },
        { status: 500 }
      );
    }
  })(request);
}
