import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { VideoModel } from '@/lib/mongodb/models/video';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { VideoStage } from '@/lib/types/models';
import { formatUserName, getClientNameById, getDepartmentNameById, formatPriorityName } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError, handleForbidden } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { isOverdueByDate, parseDueDateUTC, toDateOnlyISO } from '@/lib/date-utils';

// Parse a date-only field ("YYYY-MM-DD" from an <input type="date">) into a
// Date at UTC midnight. Returns null to clear the field, unchanged undefined,
// or throws a message mapped to HTTP 400 by the handlers.
function parseDateOnlyField(value: unknown, field: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = parseDueDateUTC(value);
  if (!parsed) {
    throw new Error(`Invalid ${field}. Use YYYY-MM-DD format.`);
  }
  return parsed;
}

async function getHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const videoDoc = await VideoModel.findByNumericId(numericId);
    
    if (!videoDoc) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Role-based access check
    if (user.role === 'employee' && videoDoc.assigned_to_id !== user.userId) {
      return NextResponse.json(
        { error: 'You can only view your assigned videos.' },
        { status: 403 }
      );
    }

    let client_name = null;
    if (videoDoc.client_id) {
      const client = await ClientModel.findByNumericId(videoDoc.client_id);
      client_name = client?.name || null;
    }

    let assigned_to_name = null;
    if (videoDoc.assigned_to_id) {
      const assignee = await UserModel.findByNumericId(videoDoc.assigned_to_id);
      assigned_to_name = assignee ? `${assignee.first_name} ${assignee.last_name}`.trim() || assignee.username : null;
    }

    let created_by_name = null;
    if (videoDoc.created_by_id) {
      const creator = await UserModel.findByNumericId(videoDoc.created_by_id);
      created_by_name = creator ? `${creator.first_name} ${creator.last_name}`.trim() || creator.username : null;
    }

    let shooter_name = null;
    if (videoDoc.shooter_id) {
      const shooter = await UserModel.findByNumericId(videoDoc.shooter_id);
      shooter_name = shooter ? `${shooter.first_name} ${shooter.last_name}`.trim() || shooter.username : null;
    }

    let editor_name = null;
    if (videoDoc.editor_id) {
      const editor = await UserModel.findByNumericId(videoDoc.editor_id);
      editor_name = editor ? `${editor.first_name} ${editor.last_name}`.trim() || editor.username : null;
    }

    const is_overdue = videoDoc.deadline && isOverdueByDate(videoDoc.deadline) && videoDoc.status !== VideoStage.APPROVED && videoDoc.status !== VideoStage.POSTED;

    const videoResponse = {
      id: videoDoc.numeric_id,
      video_code: videoDoc.video_code,
      title: videoDoc.title,
      description: videoDoc.description,
      client_id: videoDoc.client_id,
      client_name,
      assigned_to_id: videoDoc.assigned_to_id,
      assigned_to_name,
      created_by_id: videoDoc.created_by_id,
      created_by_name,
      stage: videoDoc.stage,
      status: videoDoc.status,
      status_name: videoDoc.status.charAt(0).toUpperCase() + videoDoc.status.slice(1).replace('_', ' '),
      priority: videoDoc.priority,
      priority_name: videoDoc.priority.charAt(0).toUpperCase() + videoDoc.priority.slice(1),
      deadline: toDateOnlyISO(videoDoc.deadline),
      script: videoDoc.script,
      video_url: videoDoc.video_url,
      thumbnail_url: videoDoc.thumbnail_url,
      feedback: videoDoc.feedback,
      monthly_target_id: videoDoc.monthly_target_id,
      shoot_date: toDateOnlyISO(videoDoc.shoot_date),
      edit_due_date: toDateOnlyISO(videoDoc.edit_due_date),
      approval_date: toDateOnlyISO(videoDoc.approval_date),
      posted_date: toDateOnlyISO(videoDoc.posted_date),
      shooter_id: videoDoc.shooter_id,
      shooter_name,
      editor_id: videoDoc.editor_id,
      editor_name,
      social_media_handler_id: videoDoc.social_media_handler_id,
      raw_footage_urls: videoDoc.raw_footage_urls,
      edited_video_url: videoDoc.edited_video_url,
      final_video_url: videoDoc.final_video_url,
      duration: videoDoc.duration,
      format: videoDoc.format,
      rejection_reason: videoDoc.rejection_reason,
      rejection_count: videoDoc.rejection_count,
      instagram_caption: videoDoc.instagram_caption,
      instagram_hashtags: videoDoc.instagram_hashtags,
      instagram_post_url: videoDoc.instagram_post_url,
      is_overdue,
      assets: [],
      created_at: videoDoc.created_at.toISOString(),
      updated_at: videoDoc.updated_at.toISOString(),
    };

    return NextResponse.json(videoResponse);
  } catch (error) {
    return handleError(error, 'Get video');
  }
}

async function patchHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const videoDoc = await VideoModel.findByNumericId(numericId);
    
    if (!videoDoc) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Permission check
    if (user.role === 'employee' && videoDoc.assigned_to_id !== user.userId) {
      return handleForbidden('You can only update your own videos');
    }

    const body = await request.json();
    const {
      title,
      description,
      client,
      assigned_to,
      stage,
      status,
      priority,
      deadline,
      script,
      video_url,
      thumbnail_url,
      feedback,
      shoot_date,
      edit_due_date,
      approval_date,
      posted_date,
      shooter,
      editor,
      social_media_handler,
      raw_footage_urls,
      edited_video_url,
      final_video_url,
      duration,
      format,
      instagram_caption,
      instagram_hashtags,
      instagram_post_url,
    } = body;

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (stage !== undefined) updateData.stage = stage;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (script !== undefined) updateData.script = script;
    if (video_url !== undefined) updateData.video_url = video_url;
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
    if (feedback !== undefined) updateData.feedback = feedback;
    if (raw_footage_urls !== undefined) updateData.raw_footage_urls = raw_footage_urls;
    if (edited_video_url !== undefined) updateData.edited_video_url = edited_video_url;
    if (final_video_url !== undefined) updateData.final_video_url = final_video_url;
    if (duration !== undefined) updateData.duration = duration;
    if (format !== undefined) updateData.format = format;
    if (instagram_caption !== undefined) updateData.instagram_caption = instagram_caption;
    if (instagram_hashtags !== undefined) updateData.instagram_hashtags = instagram_hashtags;
    if (instagram_post_url !== undefined) updateData.instagram_post_url = instagram_post_url;

    // Handle client
    if (client !== undefined) {
      if (client === null || client === '') {
        updateData.client_id = undefined;
      } else {
        const clientDoc = await ClientModel.findByNumericId(client);
        if (!clientDoc) {
          return NextResponse.json(
            { error: 'Client not found.' },
            { status: 400 }
          );
        }
        updateData.client_id = client;
      }
    }

    // Handle assigned_to
    if (assigned_to !== undefined) {
      if (assigned_to === null || assigned_to === '') {
        updateData.assigned_to_id = undefined;
      } else {
        const assignee = await UserModel.findByNumericId(assigned_to);
        if (!assignee) {
          return NextResponse.json(
            { error: 'Assigned user not found.' },
            { status: 400 }
          );
        }
        updateData.assigned_to_id = assigned_to;
      }
    }

    if (deadline !== undefined) updateData.deadline = parseDateOnlyField(deadline, 'deadline');
    if (shoot_date !== undefined) updateData.shoot_date = parseDateOnlyField(shoot_date, 'shoot_date');
    if (edit_due_date !== undefined) updateData.edit_due_date = parseDateOnlyField(edit_due_date, 'edit_due_date');
    if (approval_date !== undefined) updateData.approval_date = parseDateOnlyField(approval_date, 'approval_date');
    if (posted_date !== undefined) updateData.posted_date = parseDateOnlyField(posted_date, 'posted_date');
    if (shooter !== undefined) updateData.shooter_id = shooter || undefined;
    if (editor !== undefined) updateData.editor_id = editor || undefined;
    if (social_media_handler !== undefined) updateData.social_media_handler_id = social_media_handler || undefined;

    const oldStatus = videoDoc.status;
    const updatedVideo = await VideoModel.update(numericId, updateData);
    
    if (!updatedVideo) {
      return NextResponse.json(
        { error: 'Failed to update video' },
        { status: 500 }
      );
    }

    // Log status change
    if (stage && stage !== videoDoc.stage) {
      await logActivity({
        actorId: user.userId,
        action: 'STATUS_CHANGE',
        entityType: 'video',
        entityId: updatedVideo.numeric_id.toString(),
        description: `Video stage changed from ${videoDoc.stage} to ${stage}`,
        metadata: { old_stage: videoDoc.stage, new_stage: stage },
        request,
      });
    }

    let client_name = null;
    if (updatedVideo.client_id) {
      const client = await ClientModel.findByNumericId(updatedVideo.client_id);
      client_name = client?.name || null;
    }

    let assigned_to_name = null;
    if (updatedVideo.assigned_to_id) {
      const assignee = await UserModel.findByNumericId(updatedVideo.assigned_to_id);
      assigned_to_name = assignee ? `${assignee.first_name} ${assignee.last_name}`.trim() || assignee.username : null;
    }

    const videoResponse = {
      id: updatedVideo.numeric_id,
      video_code: updatedVideo.video_code,
      title: updatedVideo.title,
      description: updatedVideo.description,
      client_id: updatedVideo.client_id,
      client_name,
      assigned_to_id: updatedVideo.assigned_to_id,
      assigned_to_name,
      created_by_id: updatedVideo.created_by_id,
      stage: updatedVideo.stage,
      status: updatedVideo.status,
      status_name: updatedVideo.status.charAt(0).toUpperCase() + updatedVideo.status.slice(1).replace('_', ' '),
      priority: updatedVideo.priority,
      priority_name: updatedVideo.priority.charAt(0).toUpperCase() + updatedVideo.priority.slice(1),
      deadline: toDateOnlyISO(updatedVideo.deadline),
      script: updatedVideo.script,
      video_url: updatedVideo.video_url,
      thumbnail_url: updatedVideo.thumbnail_url,
      feedback: updatedVideo.feedback,
      monthly_target_id: updatedVideo.monthly_target_id,
      shoot_date: toDateOnlyISO(updatedVideo.shoot_date),
      edit_due_date: toDateOnlyISO(updatedVideo.edit_due_date),
      approval_date: toDateOnlyISO(updatedVideo.approval_date),
      posted_date: toDateOnlyISO(updatedVideo.posted_date),
      shooter_id: updatedVideo.shooter_id,
      editor_id: updatedVideo.editor_id,
      social_media_handler_id: updatedVideo.social_media_handler_id,
      raw_footage_urls: updatedVideo.raw_footage_urls,
      edited_video_url: updatedVideo.edited_video_url,
      final_video_url: updatedVideo.final_video_url,
      duration: updatedVideo.duration,
      format: updatedVideo.format,
      rejection_reason: updatedVideo.rejection_reason,
      rejection_count: updatedVideo.rejection_count,
      instagram_caption: updatedVideo.instagram_caption,
      instagram_hashtags: updatedVideo.instagram_hashtags,
      instagram_post_url: updatedVideo.instagram_post_url,
      is_overdue: false,
      assets: [],
      created_at: updatedVideo.created_at.toISOString(),
      updated_at: updatedVideo.updated_at.toISOString(),
    };

    return NextResponse.json(videoResponse);
  } catch (error: any) {
    if (error?.message && String(error.message).startsWith('Invalid ')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleError(error, 'Update video');
  }
}

async function deleteHandler(request: NextRequest, user: any, id: string) {
  try {
    // Django: Only the owner can delete videos
    if (user.role !== 'owner') {
      return handleForbidden('Only the owner can delete videos.');
    }

    const numericId = parseInt(id);
    const videoDoc = await VideoModel.findByNumericId(numericId);
    
    if (!videoDoc) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    await VideoModel.delete(numericId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Delete video');
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => getHandler(req, user, id))(request);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => patchHandler(req, user, id))(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => deleteHandler(req, user, id))(request);
}
