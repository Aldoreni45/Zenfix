import { NextRequest, NextResponse } from 'next/server';
import { VideoStageModel } from '@/lib/mongodb/models/video-protocol';
import { UserModel } from '@/lib/mongodb/models/user';
import { TaskModel } from '@/lib/mongodb/models/task';
import { requireAuth } from '@/lib/auth/middleware';
import { isOverdueByDate, parseDueDateUTC, toDateOnlyISO } from '@/lib/date-utils';

const STAGE_DISPLAY_NAMES: Record<string, string> = {
  shoot: 'Shoot Video',
  edit: 'Edit Video',
  review: 'Review Video',
  client_approval: 'Client Approval',
  instagram_post: 'Instagram Post',
};

const STATUS_DISPLAY_NAMES: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
  rejected: 'Rejected',
};

const STAGE_ORDER: Record<string, number> = {
  shoot: 0,
  edit: 1,
  review: 2,
  client_approval: 3,
  instagram_post: 4,
};

function isStageLocked(stage: any): boolean {
  if (stage.status === 'completed' || stage.status === 'in_progress') {
    return false;
  }
  const currentIdx = STAGE_ORDER[stage.stage_type] || 0;
  if (currentIdx === 0) return false;
  return true; // Simplified: would need to check previous stage
}

function isStageOverdue(stage: any): boolean {
  if (!stage.due_date || stage.status === 'completed') return false;
  return isOverdueByDate(stage.due_date);
}

// Shared serialization for a stage document, used by GET and PATCH so the
// wire format (and due_date normalization) stays identical everywhere.
async function getStageResponse(stage: any) {
  // Get assigned_to_detail
  let assigned_to_detail = null;
  if (stage.assigned_to_id) {
    const assignee = await UserModel.findByNumericId(stage.assigned_to_id);
    if (assignee) {
      assigned_to_detail = {
        id: assignee.numeric_id,
        numeric_id: assignee.numeric_id,
        first_name: assignee.first_name,
        last_name: assignee.last_name,
        email: assignee.email,
        role: assignee.role,
      };
    }
  }

  // Get linked completed task for drive_link and completion_notes fallback
  let drive_link = stage.drive_link || '';
  let completion_notes = stage.completion_notes || '';
  let submitted_by_name = null;

  const linkedTask = await TaskModel.findAll({
    video_stage_id: stage.numeric_id,
    status: 'completed'
  });

  if (linkedTask.length > 0) {
    const latestTask = linkedTask[0];
    if (!drive_link) drive_link = latestTask.drive_link || '';
    if (!completion_notes) completion_notes = latestTask.completion_notes || '';

    if (latestTask.assigned_to_id) {
      const taskAssignee = await UserModel.findByNumericId(latestTask.assigned_to_id);
      if (taskAssignee) {
        const full = `${taskAssignee.first_name} ${taskAssignee.last_name}`.trim();
        submitted_by_name = full || taskAssignee.email;
      }
    }
  }

  if (!submitted_by_name && assigned_to_detail) {
    const full = `${assigned_to_detail.first_name} ${assigned_to_detail.last_name}`.trim();
    submitted_by_name = full || assigned_to_detail.email;
  }

  return {
    id: stage.numeric_id,
    numeric_id: stage.numeric_id,
    video: stage.video_record_id,
    stage_type: stage.stage_type,
    stage_display: STAGE_DISPLAY_NAMES[stage.stage_type] || stage.stage_type,
    status: stage.status,
    status_display: STATUS_DISPLAY_NAMES[stage.status] || stage.status,
    assigned_to: stage.assigned_to_id,
    assigned_to_detail,
    started_at: stage.started_at?.toISOString(),
    completed_at: stage.completed_at?.toISOString(),
    due_date: toDateOnlyISO(stage.due_date),
    notes: stage.notes,
    rejection_reason: stage.rejection_reason,
    drive_link,
    completion_notes,
    instagram_url: stage.instagram_url,
    caption: stage.caption,
    submitted_by_name,
    is_locked: isStageLocked(stage),
    is_overdue: isStageOverdue(stage),
    created_at: stage.created_at.toISOString(),
    updated_at: stage.updated_at.toISOString(),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const stageId = parseInt(id);
      const stage = await VideoStageModel.findByNumericId(stageId);

      if (!stage) {
        return NextResponse.json(
          { error: 'Video stage not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(await getStageResponse(stage));
    } catch (error) {
      console.error('Error fetching video stage:', error);
      return NextResponse.json(
        { error: 'Failed to fetch video stage' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const stageId = parseInt(id);
      const body = await request.json();

      const existing = await VideoStageModel.findByNumericId(stageId);
      if (!existing) {
        return NextResponse.json(
          { error: 'Video stage not found' },
          { status: 404 }
        );
      }

      // Normalize any date-only field so a string like "2026-09-21" is never
      // persisted as a raw string (breaks every date-only comparison).
      if (body.due_date !== undefined && body.due_date !== null && body.due_date !== '') {
        const parsedDueDate = parseDueDateUTC(body.due_date);
        if (!parsedDueDate) {
          return NextResponse.json(
            { error: 'Invalid due_date. Use YYYY-MM-DD format.' },
            { status: 400 }
          );
        }
        body.due_date = parsedDueDate;
      }

      const updated = await VideoStageModel.update(stageId, body);
      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update video stage' },
          { status: 500 }
        );
      }

      return NextResponse.json(await getStageResponse(updated));
    } catch (error) {
      console.error('Error updating video stage:', error);
      return NextResponse.json(
        { error: 'Failed to update video stage' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const stageId = parseInt(id);
      await VideoStageModel.delete(stageId);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting video stage:', error);
      return NextResponse.json(
        { error: 'Failed to delete video stage' },
        { status: 500 }
      );
    }
  })(request);
}
