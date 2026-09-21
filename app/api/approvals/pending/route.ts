import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { ApprovalModel } from '@/lib/mongodb/models/approval';
import { UserModel } from '@/lib/mongodb/models/user';
import { VideoModel } from '@/lib/mongodb/models/video';
import { ClientModel } from '@/lib/mongodb/models/client';
import { ApprovalStatus } from '@/lib/types/models';
import { formatUserName, getClientNameById } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const filters: any = { status: ApprovalStatus.PENDING };
    
    // Role-based filtering
    if (user.role === 'owner' || user.role === 'manager') {
      // See all pending
    } else {
      filters.reviewer_id = user.userId;
    }

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
    return handleError(error, 'Pending approvals');
  }
}

export const GET = requireAuth(handler);
