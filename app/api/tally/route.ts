import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { SpendingModel } from '@/lib/mongodb/models/spending';
import { IncomeModel } from '@/lib/mongodb/models/income';
import { SalaryModel } from '@/lib/mongodb/models/salary';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const month = searchParams.get('month'); // Format: "2024-01"

      if (!month) {
        return NextResponse.json(
          { error: 'Month parameter is required (format: YYYY-MM)' },
          { status: 400 }
        );
      }

      // Parse month to get start and end dates
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);

      // Get total spending for the month
      const spendingFilter: any = {
        date: { $gte: startDate, $lte: endDate }
      };
      const totalSpending = await SpendingModel.getTotalSpending(spendingFilter);

      // Get total income for the month
      const incomeFilter: any = {
        income_date: { $gte: startDate, $lte: endDate }
      };
      const totalIncome = await IncomeModel.getTotalIncome(incomeFilter);

      // Get total salary for the month
      const totalSalary = await SalaryModel.getTotalSalaryByMonth(month);

      // Calculate profit
      const profit = totalIncome - totalSpending - totalSalary;

      return NextResponse.json({
        month,
        total_income: totalIncome,
        total_spending: totalSpending,
        total_salary: totalSalary,
        profit,
        profit_margin: totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(2) : 0,
      });
    } catch (error) {
      console.error('Error fetching tally:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tally' },
        { status: 500 }
      );
    }
  })(request);
}
