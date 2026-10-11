import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { IncomeModel } from '@/lib/mongodb/models/income';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req, user) => {
    try {
      const income = await IncomeModel.findByNumericId(Number(params.id));
      
      if (!income) {
        return NextResponse.json(
          { error: 'Income not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(income);
    } catch (error) {
      console.error('Error fetching income:', error);
      return NextResponse.json(
        { error: 'Failed to fetch income' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return requireOwner(async (req, user) => {
    try {
      const body = await request.json();
      const { amount, description, category, status, received_date, payment_method, invoice_number, notes } = body;

      const updateData: any = {};
      if (amount !== undefined) updateData.amount = Number(amount);
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (status !== undefined) {
        updateData.status = status;
        if (status === 'received') {
          updateData.received_date = new Date();
        }
      }
      if (received_date !== undefined) updateData.received_date = new Date(received_date);
      if (payment_method !== undefined) updateData.payment_method = payment_method;
      if (invoice_number !== undefined) updateData.invoice_number = invoice_number;
      if (notes !== undefined) updateData.notes = notes;

      const updatedIncome = await IncomeModel.update(Number(params.id), updateData);
      return NextResponse.json(updatedIncome);
    } catch (error) {
      console.error('Error updating income:', error);
      return NextResponse.json(
        { error: 'Failed to update income' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return requireOwner(async (req, user) => {
    try {
      const deleted = await IncomeModel.delete(Number(params.id));
      
      if (!deleted) {
        return NextResponse.json(
          { error: 'Income not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting income:', error);
      return NextResponse.json(
        { error: 'Failed to delete income' },
        { status: 500 }
      );
    }
  })(request);
}
