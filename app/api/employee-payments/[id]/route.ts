import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { EmployeePaymentModel } from '@/lib/mongodb/models/employee-payment';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth(async (req, user) => {
    try {
      const payment = await EmployeePaymentModel.findByNumericId(Number(id));
      
      if (!payment) {
        return NextResponse.json(
          { error: 'Employee payment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(payment);
    } catch (error) {
      console.error('Error fetching employee payment:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employee payment' },
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
      const { amount_paid, notes, status } = body;

      const existingPayment = await EmployeePaymentModel.findByNumericId(Number(id));
      if (!existingPayment) {
        return NextResponse.json(
          { error: 'Employee payment not found' },
          { status: 404 }
        );
      }

      const updateData: any = {};
      if (amount_paid !== undefined) {
        updateData.amount_paid = Number(amount_paid);
        updateData.amount_pending = existingPayment.total_spending - Number(amount_paid);
        
        if (updateData.amount_pending <= 0) {
          updateData.status = 'completed';
          updateData.payment_date = new Date();
        } else if (Number(amount_paid) > 0) {
          updateData.status = 'partial';
        }
      }
      if (notes !== undefined) updateData.notes = notes;
      if (status !== undefined) updateData.status = status;

      const updatedPayment = await EmployeePaymentModel.update(Number(id), updateData);
      return NextResponse.json(updatedPayment);
    } catch (error) {
      console.error('Error updating employee payment:', error);
      return NextResponse.json(
        { error: 'Failed to update employee payment' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireOwner(async (req, user) => {
    try {
      const deleted = await EmployeePaymentModel.delete(Number(id));
      
      if (!deleted) {
        return NextResponse.json(
          { error: 'Employee payment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting employee payment:', error);
      return NextResponse.json(
        { error: 'Failed to delete employee payment' },
        { status: 500 }
      );
    }
  })(request);
}
