import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { EmployeePaymentModel } from '@/lib/mongodb/models/employee-payment';
import { SpendingModel } from '@/lib/mongodb/models/spending';

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
        const previouslyPaid = existingPayment.amount_paid || 0;
        updateData.amount_paid = Number(amount_paid);
        updateData.amount_pending = existingPayment.total_spending - Number(amount_paid);
        
        if (updateData.amount_pending <= 0) {
          updateData.status = 'completed';
          updateData.payment_date = new Date();
        } else if (Number(amount_paid) > 0) {
          updateData.status = 'partial';
        }

        // Mark "Yet to Pay" spendings as paid (oldest first) for the extra amount.
        const extraPaid = Number(amount_paid) - previouslyPaid;
        if (extraPaid > 0) {
          const pendingSpendings = (
            await SpendingModel.findAll({ employee_id: existingPayment.employee_id, status: 'pending' })
          ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          let remaining = extraPaid;
          for (const spending of pendingSpendings) {
            if (remaining <= 0) break;
            await SpendingModel.update(spending.numeric_id, { status: 'approved' });
            remaining -= spending.amount;
          }
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
