import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { SpendingModel } from '@/lib/mongodb/models/spending';

export async function PUT(request: NextRequest) {
  return requireOwner(async (req, user) => {
    try {
      const body = await request.json();
      const { employee_id } = body;

      if (!employee_id) {
        return NextResponse.json(
          { error: 'Employee ID is required' },
          { status: 400 }
        );
      }

      // Update all pending spending for this employee to approved
      const result = await SpendingModel.updateMany(
        { employee_id: Number(employee_id), status: 'pending' },
        { status: 'approved' }
      );

      return NextResponse.json({ 
        success: true, 
        updatedCount: result.modifiedCount 
      });
    } catch (error) {
      console.error('Error approving spending:', error);
      return NextResponse.json(
        { error: 'Failed to approve spending' },
        { status: 500 }
      );
    }
  })(request);
}
