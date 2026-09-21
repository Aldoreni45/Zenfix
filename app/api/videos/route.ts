import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { VideoModel } from '@/lib/mongodb/models/video';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { VideoStage, VideoPriority } from '@/lib/types/models';
import { formatUserName, getClientNameById, getDepartmentNameById, formatPriorityName } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError, handleValidationError, handleForbidden } from '@/lib/api-helpers/error-handler';
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

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const client = searchParams.get('client');
    const assigned_to = searchParams.get('assigned_to');
    const search = searchParams.get('search');

    const filters: any = {};
    
    // Role-based filtering
    if (user.role === 'owner' || user.role === 'manager') {
      // No filtering - see all
    } else {
      filters.assigned_to_id = user.userId;
    }

    if (stage) filters.stage = stage;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (client) filters.client_id = parseInt(client);
    if (assigned_to) filters.assigned_to_id = parseInt(assigned_to);
    
    let videos;
    if (search) {
      videos = await VideoModel.findAll({
        ...filters,
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { video_code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    } else {
      videos = await VideoModel.findAll(filters);
    }

    const videosWithDetails = await Promise.all(
      videos.map(async (v) => {
        let client_name = null;
        if (v.client_id) {
          const client = await ClientModel.findByNumericId(v.client_id);
          client_name = client?.name || null;
        }

        let assigned_to_name = null;
        if (v.assigned_to_id) {
          const assignee = await UserModel.findByNumericId(v.assigned_to_id);
          assigned_to_name = assignee ? `${assignee.first_name} ${assignee.last_name}`.trim() || assignee.username : null;
        }

        let created_by_name = null;
        if (v.created_by_id) {
          const creator = await UserModel.findByNumericId(v.created_by_id);
          created_by_name = creator ? `${creator.first_name} ${creator.last_name}`.trim() || creator.username : null;
        }

        let shooter_name = null;
        if (v.shooter_id) {
          const shooter = await UserModel.findByNumericId(v.shooter_id);
          shooter_name = shooter ? `${shooter.first_name} ${shooter.last_name}`.trim() || shooter.username : null;
        }

        let editor_name = null;
        if (v.editor_id) {
          const editor = await UserModel.findByNumericId(v.editor_id);
          editor_name = editor ? `${editor.first_name} ${editor.last_name}`.trim() || editor.username : null;
        }

        const is_overdue = v.deadline && isOverdueByDate(v.deadline) && v.status !== VideoStage.APPROVED && v.status !== VideoStage.POSTED;

        return {
          id: v.numeric_id,
          video_code: v.video_code,
          title: v.title,
          description: v.description,
          client_id: v.client_id,
          client_name,
          assigned_to_id: v.assigned_to_id,
          assigned_to_name,
          created_by_id: v.created_by_id,
          created_by_name,
          stage: v.stage,
          status: v.status,
          status_name: v.status.charAt(0).toUpperCase() + v.status.slice(1).replace('_', ' '),
          priority: v.priority,
          priority_name: v.priority.charAt(0).toUpperCase() + v.priority.slice(1),
          deadline: toDateOnlyISO(v.deadline),
          script: v.script,
          video_url: v.video_url,
          thumbnail_url: v.thumbnail_url,
          feedback: v.feedback,
          monthly_target_id: v.monthly_target_id,
          shoot_date: toDateOnlyISO(v.shoot_date),
          edit_due_date: toDateOnlyISO(v.edit_due_date),
          approval_date: toDateOnlyISO(v.approval_date),
          posted_date: toDateOnlyISO(v.posted_date),
          shooter_id: v.shooter_id,
          shooter_name,
          editor_id: v.editor_id,
          editor_name,
          social_media_handler_id: v.social_media_handler_id,
          raw_footage_urls: v.raw_footage_urls,
          edited_video_url: v.edited_video_url,
          final_video_url: v.final_video_url,
          duration: v.duration,
          format: v.format,
          rejection_reason: v.rejection_reason,
          rejection_count: v.rejection_count,
          instagram_caption: v.instagram_caption,
          instagram_hashtags: v.instagram_hashtags,
          instagram_post_url: v.instagram_post_url,
          is_overdue,
          assets: [],
          created_at: v.created_at.toISOString(),
          updated_at: v.updated_at.toISOString(),
        };
      })
    );

    return NextResponse.json(videosWithDetails);
  } catch (error) {
    return handleError(error, 'List videos');
  }
}

async function createHandler(request: NextRequest, user: any) {
  try {
    // Django: Employees cannot create videos
    if (user.role === 'employee') {
      return handleForbidden('Employees cannot create videos.');
    }

    const body = await request.json();
    const {
      title,
      description,
      client,
      assigned_to,
      created_by,
      stage = VideoStage.IDEA,
      status = VideoStage.IDEA,
      priority = VideoPriority.MEDIUM,
      deadline,
      script,
      video_url,
      thumbnail_url,
      feedback,
      monthly_target,
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

    if (!title) {
      return handleValidationError('Title is required');
    }

    // Validate client
    let client_id = null;
    if (client) {
      const clientDoc = await ClientModel.findByNumericId(client);
      if (!clientDoc) {
        return handleValidationError('Client not found');
      }
      client_id = client;
    }

    // Validate assigned_to
    let assigned_to_id = null;
    if (assigned_to) {
      const userDoc = await UserModel.findByNumericId(assigned_to);
      if (!userDoc) {
        return handleValidationError('Assigned user not found');
      }
      assigned_to_id = assigned_to;
    }

    const newVideo = await VideoModel.create({
      title,
      description,
      client_id,
      assigned_to_id,
      created_by_id: created_by || user.userId,
      stage,
      status,
      priority,
      deadline: parseDateOnlyField(deadline, 'deadline') ?? undefined,
      script,
      video_url,
      thumbnail_url,
      feedback,
      monthly_target_id: monthly_target || null,
      shoot_date: parseDateOnlyField(shoot_date, 'shoot_date') ?? undefined,
      edit_due_date: parseDateOnlyField(edit_due_date, 'edit_due_date') ?? undefined,
      approval_date: parseDateOnlyField(approval_date, 'approval_date') ?? undefined,
      posted_date: parseDateOnlyField(posted_date, 'posted_date') ?? undefined,
      shooter_id: shooter || null,
      editor_id: editor || null,
      social_media_handler_id: social_media_handler || null,
      raw_footage_urls: raw_footage_urls || [],
      edited_video_url,
      final_video_url,
      duration,
      format,
      rejection_reason: undefined,
      rejection_count: 0,
      instagram_caption,
      instagram_hashtags: instagram_hashtags || [],
      instagram_post_url,
    });

    // Log activity
    await logActivity({
      actorId: user.userId,
      action: 'CREATE',
      entityType: 'video',
      entityId: newVideo.numeric_id.toString(),
      description: `Created video ${newVideo.title}`,
      request,
    });

    let client_name = null;
    if (newVideo.client_id) {
      const client = await ClientModel.findByNumericId(newVideo.client_id);
      client_name = client?.name || null;
    }

    let assigned_to_name = null;
    if (newVideo.assigned_to_id) {
      const assignee = await UserModel.findByNumericId(newVideo.assigned_to_id);
      assigned_to_name = assignee ? `${assignee.first_name} ${assignee.last_name}`.trim() || assignee.username : null;
    }

    const videoResponse = {
      id: newVideo.numeric_id,
      video_code: newVideo.video_code,
      title: newVideo.title,
      description: newVideo.description,
      client_id: newVideo.client_id,
      client_name,
      assigned_to_id: newVideo.assigned_to_id,
      assigned_to_name,
      created_by_id: newVideo.created_by_id,
      stage: newVideo.stage,
      status: newVideo.status,
      status_name: newVideo.status.charAt(0).toUpperCase() + newVideo.status.slice(1).replace('_', ' '),
      priority: newVideo.priority,
      priority_name: newVideo.priority.charAt(0).toUpperCase() + newVideo.priority.slice(1),
      deadline: toDateOnlyISO(newVideo.deadline),
      script: newVideo.script,
      video_url: newVideo.video_url,
      thumbnail_url: newVideo.thumbnail_url,
      feedback: newVideo.feedback,
      monthly_target_id: newVideo.monthly_target_id,
      shoot_date: toDateOnlyISO(newVideo.shoot_date),
      edit_due_date: toDateOnlyISO(newVideo.edit_due_date),
      approval_date: toDateOnlyISO(newVideo.approval_date),
      posted_date: toDateOnlyISO(newVideo.posted_date),
      shooter_id: newVideo.shooter_id,
      editor_id: newVideo.editor_id,
      social_media_handler_id: newVideo.social_media_handler_id,
      raw_footage_urls: newVideo.raw_footage_urls,
      edited_video_url: newVideo.edited_video_url,
      final_video_url: newVideo.final_video_url,
      duration: newVideo.duration,
      format: newVideo.format,
      rejection_reason: newVideo.rejection_reason,
      rejection_count: newVideo.rejection_count,
      instagram_caption: newVideo.instagram_caption,
      instagram_hashtags: newVideo.instagram_hashtags,
      instagram_post_url: newVideo.instagram_post_url,
      is_overdue: false,
      assets: [],
      created_at: newVideo.created_at.toISOString(),
      updated_at: newVideo.updated_at.toISOString(),
    };

    return NextResponse.json(videoResponse, { status: 201 });
  } catch (error: any) {
    if (error?.message && String(error.message).startsWith('Invalid ')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleError(error, 'Create video');
  }
}

export const GET = requireAuth(handler);
export const POST = requireAuth(createHandler);
