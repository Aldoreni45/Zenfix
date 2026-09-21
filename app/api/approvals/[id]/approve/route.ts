import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { ApprovalModel } from '@/lib/mongodb/models/approval';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { ActivityAction } from '@/lib/types/models';
import { ApprovalStatus } from '@/lib/types/models';
import { handleError, handleForbidden } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { sendApprovalApprovedNotification } from '@/lib/api-helpers/notification-helper';

async function handler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const approvalDoc = await ApprovalModel.findByNumericId(numericId);
    
    if (!approvalDoc) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    if (user.role === 'employee') {
      return handleForbidden('Employees cannot approve');
    }

    const body = await request.json();
    const { comments } = body;

    const updatedApproval = await ApprovalModel.update(numericId, {
      status: ApprovalStatus.APPROVED,
      reviewed_by_id: user.userId,
      reviewer_id: user.userId,
      reviewed_at: new Date(),
      reviewer_comments: comments,
    });

    if (!updatedApproval) {
      return NextResponse.json(
        { error: 'Failed to approve' },
        { status: 500 }
      );
    }

    // Log activity
    await logActivity({
      actorId: user.userId,
      action: ActivityAction.APPROVE,
      entityType: 'approval',
      entityId: updatedApproval.numeric_id.toString(),
      description: `Approval ${updatedApproval.approval_type} approved`,
      request,
    });

    // Send notification to requester
    if (updatedApproval.requested_by_id) {
      await sendApprovalApprovedNotification(updatedApproval.requested_by_id, updatedApproval.approval_type, updatedApproval.numeric_id.toString());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Approve');
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => handler(req, user, id))(request);
}
