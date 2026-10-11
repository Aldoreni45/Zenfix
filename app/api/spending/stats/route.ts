import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { SpendingModel } from '@/lib/mongodb/models/spending';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');
      const year = searchParams.get('year');
      const month = searchParams.get('month');

      // Role-based filtering - managers see all spendings they can access
      const filters: any = {};
      
      // No filtering by created_by for managers - they see all spendings
      // Only owners see all company-wide spendings
      // For now, both managers and owners see all spendings

      if (year && month) {
        // Filter by year and month
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        // Cover both UTC and local month boundaries to avoid timezone truncation
        const startOfMonthUTC = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
        const endOfMonthUTC = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));
        const startOfMonthLocal = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
        const endOfMonthLocal = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        const minStart = startOfMonthUTC < startOfMonthLocal ? startOfMonthUTC : startOfMonthLocal;
        const maxEnd = endOfMonthUTC > endOfMonthLocal ? endOfMonthUTC : endOfMonthLocal;
        filters.date = {
          $gte: minStart,
          $lte: maxEnd,
        };
      } else if (startDate || endDate) {
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

      // Get spending breakdown by category
      const spendings = await SpendingModel.findAll(filters);
      const breakdown = new Map<string, { amount: number; count: number }>();
      spendings.forEach((s: any) => {
        const category = s.category || 'Uncategorized';
        const entry = breakdown.get(category) || { amount: 0, count: 0 };
        entry.amount += s.amount;
        entry.count += 1;
        breakdown.set(category, entry);
      });

      return NextResponse.json({
        total_spending: totalSpending,
        spending_by_client: spendingByClient,
        spending_by_employee: spendingByEmployee,
        by_status: {
          pending: pendingTotal,
          approved: approvedTotal,
          rejected: rejectedTotal,
        },
        breakdown: [...breakdown.entries()].map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
        })),
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
