import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { ApprovalModel } from '@/lib/mongodb/models/approval';
import { UserModel } from '@/lib/mongodb/models/user';
import { VideoModel } from '@/lib/mongodb/models/video';
import { ClientModel } from '@/lib/mongodb/models/client';
import { formatUserName, getClientNameById } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError } from '@/lib/api-helpers/error-handler';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { ActivityAction } from '@/lib/types/models';
import { ApprovalStatus } from '@/lib/types/models';

async function getHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const approvalDoc = await ApprovalModel.findByNumericId(numericId);
    
    if (!approvalDoc) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    let video_code = null;
    let client_name = null;
    if (approvalDoc.video_id) {
      const video = await VideoModel.findByNumericId(approvalDoc.video_id);
      if (video) {
        video_code = video.video_code;
        if (video.client_id) {
          const client = await ClientModel.findByNumericId(video.client_id);
          client_name = client?.name || null;
        }
      }
    }

    let reviewer_name = null;
    if (approvalDoc.reviewer_id) {
      const reviewer = await UserModel.findByNumericId(approvalDoc.reviewer_id);
      reviewer_name = reviewer ? `${reviewer.first_name} ${reviewer.last_name}`.trim() || reviewer.username : null;
    }

    let requested_by_name = null;
    if (approvalDoc.requested_by_id) {
      const requester = await UserModel.findByNumericId(approvalDoc.requested_by_id);
      requested_by_name = requester ? `${requester.first_name} ${requester.last_name}`.trim() || requester.username : null;
    }

    const approvalResponse = {
      id: approvalDoc.numeric_id,
      content_type: approvalDoc.content_type,
      object_id: approvalDoc.object_id,
      video_id: approvalDoc.video_id,
      video_code,
      client_name,
      task_id: approvalDoc.task_id,
      approval_type: approvalDoc.approval_type,
      approval_type_name: approvalDoc.approval_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      requested_by_id: approvalDoc.requested_by_id,
      requested_by_name,
      reviewed_by_id: approvalDoc.reviewed_by_id,
      reviewer_id: approvalDoc.reviewer_id,
      reviewer_name,
      status: approvalDoc.status,
      status_name: approvalDoc.status.charAt(0).toUpperCase() + approvalDoc.status.slice(1).replace('_', ' '),
      comments: approvalDoc.comments,
      reviewer_comments: approvalDoc.reviewer_comments,
      requested_at: approvalDoc.requested_at.toISOString(),
      reviewed_at: approvalDoc.reviewed_at?.toISOString(),
      client_contact: approvalDoc.client_contact,
      client_email: approvalDoc.client_email,
      change_requests: approvalDoc.change_requests,
      created_at: approvalDoc.created_at.toISOString(),
      updated_at: approvalDoc.updated_at.toISOString(),
    };

    return NextResponse.json(approvalResponse);
  } catch (error) {
    return handleError(error, 'Get approval');
  }
}

async function patchHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const approvalDoc = await ApprovalModel.findByNumericId(numericId);
    
    if (!approvalDoc) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { comments, reviewer_comments, change_requests } = body;

    const updateData: any = {};
    
    if (comments !== undefined) updateData.comments = comments;
    if (reviewer_comments !== undefined) updateData.reviewer_comments = reviewer_comments;
    if (change_requests !== undefined) updateData.change_requests = change_requests;

    const updatedApproval = await ApprovalModel.update(numericId, updateData);
    
    if (!updatedApproval) {
      return NextResponse.json(
        { error: 'Failed to update approval' },
        { status: 500 }
      );
    }

    let video_code = null;
    let client_name = null;
    if (updatedApproval.video_id) {
      const video = await VideoModel.findByNumericId(updatedApproval.video_id);
      if (video) {
        video_code = video.video_code;
        if (video.client_id) {
          const client = await ClientModel.findByNumericId(video.client_id);
          client_name = client?.name || null;
        }
      }
    }

    let reviewer_name = null;
    if (updatedApproval.reviewer_id) {
      const reviewer = await UserModel.findByNumericId(updatedApproval.reviewer_id);
      reviewer_name = reviewer ? `${reviewer.first_name} ${reviewer.last_name}`.trim() || reviewer.username : null;
    }

    let requested_by_name = null;
    if (updatedApproval.requested_by_id) {
      const requester = await UserModel.findByNumericId(updatedApproval.requested_by_id);
      requested_by_name = requester ? `${requester.first_name} ${requester.last_name}`.trim() || requester.username : null;
    }

    const approvalResponse = {
      id: updatedApproval.numeric_id,
      content_type: updatedApproval.content_type,
      object_id: updatedApproval.object_id,
      video_id: updatedApproval.video_id,
      video_code,
      client_name,
      task_id: updatedApproval.task_id,
      approval_type: updatedApproval.approval_type,
      approval_type_name: updatedApproval.approval_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      requested_by_id: updatedApproval.requested_by_id,
      requested_by_name,
      reviewed_by_id: updatedApproval.reviewed_by_id,
      reviewer_id: updatedApproval.reviewer_id,
      reviewer_name,
      status: updatedApproval.status,
      status_name: updatedApproval.status.charAt(0).toUpperCase() + updatedApproval.status.slice(1).replace('_', ' '),
      comments: updatedApproval.comments,
      reviewer_comments: updatedApproval.reviewer_comments,
      requested_at: updatedApproval.requested_at.toISOString(),
      reviewed_at: updatedApproval.reviewed_at?.toISOString(),
      client_contact: updatedApproval.client_contact,
      client_email: updatedApproval.client_email,
      change_requests: updatedApproval.change_requests,
      created_at: updatedApproval.created_at.toISOString(),
      updated_at: updatedApproval.updated_at.toISOString(),
    };

    return NextResponse.json(approvalResponse);
  } catch (error) {
    return handleError(error, 'Update approval');
  }
}

async function deleteHandler(request: NextRequest, user: any, id: string) {
  try {
    if (user.role === 'employee') {
      return NextResponse.json(
        { error: 'Employees cannot delete approvals' },
        { status: 403 }
      );
    }

    const numericId = parseInt(id);
    const approvalDoc = await ApprovalModel.findByNumericId(numericId);
    
    if (!approvalDoc) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    await ApprovalModel.delete(numericId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Delete approval');
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
