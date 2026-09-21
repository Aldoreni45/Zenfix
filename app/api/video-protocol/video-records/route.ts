import { NextRequest, NextResponse } from 'next/server';
import { VideoRecordModel, VideoStageModel } from '@/lib/mongodb/models/video-protocol';
import { requireAuth } from '@/lib/auth/middleware';

const STAGE_COUNT = 5;

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const protocolId = searchParams.get('protocol');

      const filters: any = {};
      if (protocolId) {
        filters.protocol_id = parseInt(protocolId);
      }

      const records = await VideoRecordModel.findAll(filters);
      
      // Enrich with stages and calculated fields (Django serializer parity)
      const recordsWithDetails = await Promise.all(
        records.map(async (record) => {
          const stages = await VideoStageModel.findAll({ video_record_id: record.numeric_id });
          
          // Calculate completion percentage
          const completed = stages.filter(s => s.status === 'completed').length;
          const completion_percentage = STAGE_COUNT ? Math.round((completed / STAGE_COUNT) * 100) : 0;
          
          return {
            id: record.numeric_id,
            numeric_id: record.numeric_id,
            protocol: record.protocol_id,
            video_number: record.video_number,
            title: record.title,
            stages,
            current_status: record.current_status,
            current_stage_name: record.current_stage_name,
            completion_percentage,
            created_at: record.created_at.toISOString(),
            updated_at: record.updated_at.toISOString(),
          };
        })
      );
      
      return NextResponse.json(recordsWithDetails);
    } catch (error) {
      console.error('Error fetching video records:', error);
      return NextResponse.json(
        { error: 'Failed to fetch video records' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { protocol_id, video_number, title } = body;

      if (!protocol_id || !video_number) {
        return NextResponse.json(
          { error: 'protocol_id and video_number are required' },
          { status: 400 }
        );
      }

      const now = new Date();
      const record = await VideoRecordModel.create({
        protocol_id,
        video_number,
        title,
        client_id: 0, // Will be updated later
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        target_videos: 0,
        status: 'not_started',
        current_status: 'not_started',
        current_stage_name: '',
        completion_percentage: 0,
      });

      return NextResponse.json(record, { status: 201 });
    } catch (error) {
      console.error('Error creating video record:', error);
      return NextResponse.json(
        { error: 'Failed to create video record' },
        { status: 500 }
      );
    }
  })(request);
}
