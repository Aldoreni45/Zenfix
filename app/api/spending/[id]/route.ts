import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner, requireOwnerOrManager } from '@/lib/auth/middleware';
import { SpendingModel } from '@/lib/mongodb/models/spending';
import { UserModel } from '@/lib/mongodb/models/user';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth(async (req, user) => {
    try {
      const numeric_id = Number(id);
      const spending = await SpendingModel.findByNumericId(numeric_id);

      if (!spending) {
        return NextResponse.json(
          { error: 'Spending not found' },
          { status: 404 }
        );
      }

      // Managers can only view spendings they created
      if (user.role !== 'owner' && spending.created_by !== user.userId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Enrich with employee details
      const employee = spending.employee_id ? await UserModel.findByNumericId(spending.employee_id) : null;
      
      return NextResponse.json({
        ...spending,
        employee_name: employee ? `${employee.first_name} ${employee.last_name}` : spending.employee_name,
        employee_email: employee?.email || spending.employee_email,
      });
    } catch (error) {
      console.error('Error fetching spending:', error);
      return NextResponse.json(
        { error: 'Failed to fetch spending' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireOwnerOrManager(async (req, user) => {
    try {
      const numeric_id = Number(id);
      const spending = await SpendingModel.findByNumericId(numeric_id);

      if (!spending) {
        return NextResponse.json(
          { error: 'Spending not found' },
          { status: 404 }
        );
      }

      // Managers can only edit spendings they created
      if (user.role !== 'owner' && spending.created_by !== user.userId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { amount, description, category, location, date, notes, receipt_url } = body;

      const updateData: any = {};
      if (amount !== undefined) updateData.amount = Number(amount);
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (location !== undefined) updateData.location = location;
      if (date !== undefined) updateData.date = new Date(date);
      if (notes !== undefined) updateData.notes = notes;
      if (receipt_url !== undefined) updateData.receipt_url = receipt_url;

      const updated = await SpendingModel.update(numeric_id, updateData);

      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating spending:', error);
      return NextResponse.json(
        { error: 'Failed to update spending' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireOwner(async (req, user) => {
    try {
      const numeric_id = Number(id);
      const spending = await SpendingModel.findByNumericId(numeric_id);

      if (!spending) {
        return NextResponse.json(
          { error: 'Spending not found' },
          { status: 404 }
        );
      }

      await SpendingModel.delete(numeric_id);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting spending:', error);
      return NextResponse.json(
        { error: 'Failed to delete spending' },
        { status: 500 }
      );
    }
  })(request);
}
