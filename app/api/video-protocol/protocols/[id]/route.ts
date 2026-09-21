import { NextRequest, NextResponse } from 'next/server';
import { VideoProtocolModel, VideoRecordModel, VideoStageModel } from '@/lib/mongodb/models/video-protocol';
import { requireAuth, requireOwnerOrManager } from '@/lib/auth/middleware';
import { handleError, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { loadProtocolContent, syncProtocolTarget } from '@/lib/api-helpers/video-protocol';

async function serializeProtocol(refreshed: any, videos: any[]) {
  return {
    id: refreshed.numeric_id,
    numeric_id: refreshed.numeric_id,
    client: refreshed.client_id,
    client_name: refreshed.client_name || '',
    month: refreshed.month,
    year: refreshed.year,
    target_videos: refreshed.target_videos,
    status: refreshed.status,
    videos,
    workflow_progress: refreshed.workflow_progress,
    completed_stages: refreshed.completed_stages,
    total_stages: refreshed.total_stages,
    fully_completed_videos: refreshed.fully_completed_videos,
    stage_counts: refreshed.stage_counts || {},
    video_status_counts: refreshed.video_status_counts || { not_started: 0, in_progress: 0, posted: 0 },
    created_at: refreshed.created_at.toISOString(),
    updated_at: refreshed.updated_at.toISOString(),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const protocol = await VideoProtocolModel.findByNumericId(parseInt(id));
      if (!protocol) {
        return NextResponse.json({ error: 'Protocol not found' }, { status: 404 });
      }
      const { protocol: fresh, summaries } = await loadProtocolContent(protocol);
      return NextResponse.json(await serializeProtocol(fresh, summaries));
    } catch (error) {
      return handleError(error, 'Get protocol detail');
    }
  })(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const { id } = await params;
      const protocolId = parseInt(id);
      const protocol = await VideoProtocolModel.findByNumericId(protocolId);
      if (!protocol) {
        return NextResponse.json({ error: 'Protocol not found' }, { status: 404 });
      }

      const body = await request.json();
      const { status, target_videos, confirm_reduction } = body;
      const updates: any = {};

      if (status !== undefined) {
        if (!['active', 'completed', 'paused', 'archived'].includes(status)) {
          return handleValidationError('Invalid protocol status');
        }
        updates.status = status;
      }

      let logDescription = '';
      if (target_videos !== undefined && target_videos !== protocol.target_videos) {
        if (target_videos < 0) {
          return handleValidationError('target_videos cannot be negative');
        }
        if (target_videos < protocol.target_videos && !confirm_reduction) {
          return handleValidationError('confirm_reduction required when reducing target');
        }
        updates.target_videos = target_videos;
        logDescription = `Monthly target updated from ${protocol.target_videos} to ${target_videos}`;
      }

      if (Object.keys(updates).length > 0) {
        await VideoProtocolModel.update(protocolId, updates);
        if (updates.target_videos !== undefined) {
          await syncProtocolTarget(protocol, updates.target_videos);
        }
      }

      await logActivity({
        actorId: user.userId,
        action: 'UPDATE',
        entityType: 'monthly_video_protocol',
        entityId: protocol.numeric_id.toString(),
        description: logDescription || `Protocol ${protocol.numeric_id} updated`,
        metadata: updates,
        request: req,
      });

      const refreshed = (await VideoProtocolModel.findByNumericId(protocolId)) || protocol;
      return NextResponse.json(await serializeProtocol(refreshed, []));
    } catch (error) {
      return handleError(error, 'Update protocol');
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const { id } = await params;
      const protocolId = parseInt(id);
      const protocol = await VideoProtocolModel.findByNumericId(protocolId);
      if (!protocol) {
        return NextResponse.json({ error: 'Protocol not found' }, { status: 404 });
      }

      const records = await VideoRecordModel.findByProtocol(protocolId);
      const recordIds = records.map((r) => r.numeric_id);
      if (recordIds.length) {
        const stages = await VideoStageModel.findAll({ video_record_id: { $in: recordIds } } as any);
        for (const s of stages) await VideoStageModel.delete(s.numeric_id);
      }
      for (const rec of records) await VideoRecordModel.delete(rec.numeric_id);
      await VideoProtocolModel.delete(protocolId);

      await logActivity({
        actorId: user.userId,
        action: 'DELETE',
        entityType: 'monthly_video_protocol',
        entityId: protocol.numeric_id.toString(),
        description: `Video protocol deleted (client: ${protocol.client_name || protocol.client_id})`,
        request: req,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error, 'Delete protocol');
    }
  })(request);
}