import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { ApprovalModel } from '@/lib/mongodb/models/approval';
import { UserModel } from '@/lib/mongodb/models/user';
import { VideoModel } from '@/lib/mongodb/models/video';
import { ClientModel } from '@/lib/mongodb/models/client';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { ApprovalStatus } from '@/lib/types/models';
import { formatUserName, getClientNameById } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError, handleValidationError, handleForbidden } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { sendApprovalNotification } from '@/lib/api-helpers/notification-helper';
import { ActivityAction } from '@/lib/types/models';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const reviewer = searchParams.get('reviewer');

    const filters: any = {};
    
    // Role-based filtering
    if (user.role === 'owner' || user.role === 'manager') {
      // No filtering - see all
    } else {
      filters.reviewer_id = user.userId;
    }

    if (status) filters.status = status;
    if (type) filters.approval_type = type;
    if (reviewer) filters.reviewer_id = parseInt(reviewer);

    const approvals = await ApprovalModel.findAll(filters);

    const approvalsWithDetails = await Promise.all(
      approvals.map(async (a) => {
        let video_code = null;
        let client_name = null;
        if (a.video_id) {
          const video = await VideoModel.findByNumericId(a.video_id);
          if (video) {
            video_code = video.video_code;
            if (video.client_id) {
              const client = await ClientModel.findByNumericId(video.client_id);
              client_name = client?.name || null;
            }
          }
        }

        let reviewer_name = null;
        if (a.reviewer_id) {
          const reviewer = await UserModel.findByNumericId(a.reviewer_id);
          reviewer_name = reviewer ? `${reviewer.first_name} ${reviewer.last_name}`.trim() || reviewer.username : null;
        }

        let requested_by_name = null;
        if (a.requested_by_id) {
          const requester = await UserModel.findByNumericId(a.requested_by_id);
          requested_by_name = requester ? `${requester.first_name} ${requester.last_name}`.trim() || requester.username : null;
        }

        return {
          id: a.numeric_id,
          content_type: a.content_type,
          object_id: a.object_id,
          video_id: a.video_id,
          video_code,
          client_name,
          task_id: a.task_id,
          approval_type: a.approval_type,
          approval_type_name: a.approval_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          requested_by_id: a.requested_by_id,
          requested_by_name,
          reviewed_by_id: a.reviewed_by_id,
          reviewer_id: a.reviewer_id,
          reviewer_name,
          status: a.status,
          status_name: a.status.charAt(0).toUpperCase() + a.status.slice(1).replace('_', ' '),
          comments: a.comments,
          reviewer_comments: a.reviewer_comments,
          requested_at: a.requested_at.toISOString(),
          reviewed_at: a.reviewed_at?.toISOString(),
          client_contact: a.client_contact,
          client_email: a.client_email,
          change_requests: a.change_requests,
          created_at: a.created_at.toISOString(),
          updated_at: a.updated_at.toISOString(),
        };
      })
    );

    return NextResponse.json(approvalsWithDetails);
  } catch (error) {
    return handleError(error, 'List approvals');
  }
}

async function createHandler(request: NextRequest, user: any) {
  try {
    if (user.role === 'employee') {
      return handleForbidden('Employees cannot create approvals');
    }

    const body = await request.json();
    const {
      content_type,
      object_id,
      video,
      task,
      approval_type,
      reviewer,
      comments,
      client_contact,
      client_email,
      requested_by,
    } = body;

    if (!content_type || !object_id || !approval_type) {
      return NextResponse.json(
        { error: 'content_type, object_id, and approval_type are required' },
        { status: 400 }
      );
    }

    if (!requested_by) {
      return handleValidationError('requested_by is required');
    }

    // Validate reviewer
    let reviewer_id = null;
    if (reviewer) {
      const reviewerUser = await UserModel.findByNumericId(reviewer);
      if (!reviewerUser) {
        return NextResponse.json(
          { error: 'Reviewer not found.' },
          { status: 400 }
        );
      }
      reviewer_id = reviewer;
    }

    const newApproval = await ApprovalModel.create({
      content_type,
      object_id,
      video_id: video || null,
      task_id: task || null,
      approval_type,
      requested_by_id: requested_by,
      reviewer_id,
      status: ApprovalStatus.PENDING,
      comments,
      client_contact,
      client_email,
      change_requests: [],
    });

    // Log activity
    await logActivity({
      actorId: user.userId,
      action: ActivityAction.CREATE,
      entityType: 'approval',
      entityId: newApproval.numeric_id.toString(),
      description: `Approval request created: ${approval_type}`,
      request,
    });

    // Send notification to reviewer
    if (newApproval.reviewer_id) {
      await sendApprovalNotification(reviewer, approval_type, newApproval.numeric_id.toString());
    }

    let video_code = null;
    let client_name = null;
    if (newApproval.video_id) {
      const video = await VideoModel.findByNumericId(newApproval.video_id);
      if (video) {
        video_code = video.video_code;
        if (video.client_id) {
          const client = await ClientModel.findByNumericId(video.client_id);
          client_name = client?.name || null;
        }
      }
    }

    let reviewer_name = null;
    if (newApproval.reviewer_id) {
      const reviewer = await UserModel.findByNumericId(newApproval.reviewer_id);
      reviewer_name = reviewer ? `${reviewer.first_name} ${reviewer.last_name}`.trim() || reviewer.username : null;
    }

    let requested_by_name = null;
    if (newApproval.requested_by_id) {
      const requester = await UserModel.findByNumericId(newApproval.requested_by_id);
      requested_by_name = requester ? `${requester.first_name} ${requester.last_name}`.trim() || requester.username : null;
    }

    const approvalResponse = {
      id: newApproval.numeric_id,
      content_type: newApproval.content_type,
      object_id: newApproval.object_id,
      video_id: newApproval.video_id,
      video_code,
      client_name,
      task_id: newApproval.task_id,
      approval_type: newApproval.approval_type,
      approval_type_name: newApproval.approval_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      requested_by_id: newApproval.requested_by_id,
      requested_by_name,
      reviewed_by_id: newApproval.reviewed_by_id,
      reviewer_id: newApproval.reviewer_id,
      reviewer_name,
      status: newApproval.status,
      status_name: newApproval.status.charAt(0).toUpperCase() + newApproval.status.slice(1).replace('_', ' '),
      comments: newApproval.comments,
      reviewer_comments: newApproval.reviewer_comments,
      requested_at: newApproval.requested_at.toISOString(),
      reviewed_at: newApproval.reviewed_at?.toISOString(),
      client_contact: newApproval.client_contact,
      client_email: newApproval.client_email,
      change_requests: newApproval.change_requests,
      created_at: newApproval.created_at.toISOString(),
      updated_at: newApproval.updated_at.toISOString(),
    };

    return NextResponse.json(approvalResponse, { status: 201 });
  } catch (error) {
    return handleError(error, 'Create approval');
  }
}

export const GET = requireAuth(handler);
export const POST = requireAuth(createHandler);
