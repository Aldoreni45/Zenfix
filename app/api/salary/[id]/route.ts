import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { SalaryModel } from '@/lib/mongodb/models/salary';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth(async (req, user) => {
    try {
      const salary = await SalaryModel.findByNumericId(Number(id));
      
      if (!salary) {
        return NextResponse.json(
          { error: 'Salary not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(salary);
    } catch (error) {
      console.error('Error fetching salary:', error);
      return NextResponse.json(
        { error: 'Failed to fetch salary' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireOwner(async (req, user) => {
    try {
      const body = await request.json();
      const { amount, status, notes } = body;

      const updateData: any = {};
      if (amount !== undefined) updateData.amount = Number(amount);
      if (status !== undefined) {
        updateData.status = status;
        if (status === 'paid') {
          updateData.paid_date = new Date();
        }
      }
      if (notes !== undefined) updateData.notes = notes;

      const updatedSalary = await SalaryModel.update(Number(id), updateData);
      return NextResponse.json(updatedSalary);
    } catch (error) {
      console.error('Error updating salary:', error);
      return NextResponse.json(
        { error: 'Failed to update salary' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireOwner(async (req, user) => {
    try {
      const deleted = await SalaryModel.delete(Number(id));
      
      if (!deleted) {
        return NextResponse.json(
          { error: 'Salary not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting salary:', error);
      return NextResponse.json(
        { error: 'Failed to delete salary' },
        { status: 500 }
      );
    }
  })(request);
}
