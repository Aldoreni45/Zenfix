import { NextRequest, NextResponse } from 'next/server';
import { ApprovalModel } from '@/lib/mongodb/models/approval';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const approvalId = parseInt(id);
      const body = await request.json();
      const { comments, change_requests } = body;

      const approval = await ApprovalModel.findByNumericId(approvalId);
      if (!approval) {
        return NextResponse.json(
          { error: 'Approval not found' },
          { status: 404 }
        );
      }

      // Update approval with changes requested
      await ApprovalModel.update(approvalId, {
        status: 'changes_requested',
        reviewer_comments: comments,
        change_requests: change_requests || [],
      });

      // Log activity
      await ActivityLogModel.create({
        actor_id: user.userId,
        action: ActivityAction.UPDATE,
        entity_type: 'approval',
        entity_id: String(approvalId),
        description: `Changes requested for approval`,
        metadata: { approval_id: approvalId, change_requests },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error requesting changes:', error);
      return NextResponse.json(
        { error: 'Failed to request changes' },
        { status: 500 }
      );
    }
  })(request);
}
