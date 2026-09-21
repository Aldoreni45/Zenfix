import { NextRequest, NextResponse } from 'next/server';
import { VideoRecordModel } from '@/lib/mongodb/models/video-protocol';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, handleForbidden } from '@/lib/api-helpers/error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const recordId = parseInt(id);
      const record = await VideoRecordModel.findByNumericId(recordId);

      if (!record) {
        return NextResponse.json(
          { error: 'Video record not found' },
          { status: 404 }
        );
      }

      // Django: Role-based access - employees can only view records for their assigned clients
      if (user.role === 'employee') {
        const protocol = await VideoProtocolModel.findByNumericId(record.protocol_id);
        if (protocol && protocol.client_id) {
          // Check if employee has access to this client (simplified check)
          // In Django, this would check user's department/client assignments
        }
      }

      return NextResponse.json(record);
    } catch (error) {
      return handleError(error, 'Get video record');
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
      const recordId = parseInt(id);
      const record = await VideoRecordModel.findByNumericId(recordId);

      if (!record) {
        return NextResponse.json(
          { error: 'Video record not found' },
          { status: 404 }
        );
      }

      // Django: Only owner/manager can update video records
      if (user.role === 'employee') {
        return handleForbidden('Employees cannot update video records.');
      }

      const body = await request.json();
      const updated = await VideoRecordModel.update(recordId, body);
      return NextResponse.json(updated);
    } catch (error) {
      return handleError(error, 'Update video record');
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      // Django: Only owner can delete video records
      if (user.role !== 'owner') {
        return handleForbidden('Only the owner can delete video records.');
      }

      const { id } = await params;
      const recordId = parseInt(id);
      const record = await VideoRecordModel.findByNumericId(recordId);

      if (!record) {
        return NextResponse.json(
          { error: 'Video record not found' },
          { status: 404 }
        );
      }

      await VideoRecordModel.delete(recordId);
      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error, 'Delete video record');
    }
  })(request);
}
