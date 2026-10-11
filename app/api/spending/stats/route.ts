import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { SpendingModel } from '@/lib/mongodb/models/spending';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');

      // Role-based filtering - managers see all spendings they can access
      const filters: any = {};
      
      // No filtering by created_by for managers - they see all spendings
      // Only owners see all company-wide spendings
      // For now, both managers and owners see all spendings

      if (startDate || endDate) {
        filters.date = {};
        if (startDate) filters.date.$gte = new Date(startDate);
        if (endDate) filters.date.$lte = new Date(endDate);
      }

      // Get total spending
      const totalSpending = await SpendingModel.getTotalSpending(filters);

      // Get spending by client
      const spendingByClient = await SpendingModel.getSpendingByClient(filters);

      // Get spending by employee
      const spendingByEmployee = await SpendingModel.getSpendingByEmployee(filters);

      // Get spending by status
      const pendingTotal = await SpendingModel.getTotalSpending({ ...filters, status: 'pending' });
      const approvedTotal = await SpendingModel.getTotalSpending({ ...filters, status: 'approved' });
      const rejectedTotal = await SpendingModel.getTotalSpending({ ...filters, status: 'rejected' });

      return NextResponse.json({
        total_spending: totalSpending,
        spending_by_client: spendingByClient,
        spending_by_employee: spendingByEmployee,
        by_status: {
          pending: pendingTotal,
          approved: approvedTotal,
          rejected: rejectedTotal,
        },
      });
    } catch (error) {
      console.error('Error fetching spending stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch spending stats' },
        { status: 500 }
      );
    }
  })(request);
}
