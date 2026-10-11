import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { IncomeModel } from '@/lib/mongodb/models/income';
import { ClientModel } from '@/lib/mongodb/models/client';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const clientId = searchParams.get('client_id');
      const status = searchParams.get('status');
      const year = searchParams.get('year');
      const month = searchParams.get('month');

      const filters: any = {};
      if (clientId) filters.client_id = Number(clientId);
      if (status) filters.status = status;

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
        filters.income_date = {
          $gte: minStart,
          $lte: maxEnd,
        };
      }

      const income = await IncomeModel.findAll(filters);
      
      // Enrich with client details
      const enrichedIncome = await Promise.all(
        income.map(async (inc) => {
          if (inc.client_id) {
            const client = await ClientModel.findByNumericId(inc.client_id);
            return {
              ...inc,
              client_name: client ? client.name : inc.client_name,
            };
          }
          return inc;
        })
      );

      // Calculate total income and breakdown by category
      const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
      const breakdown = new Map<string, { amount: number; count: number }>();
      income.forEach((inc: any) => {
        const category = inc.category || 'Uncategorized';
        const entry = breakdown.get(category) || { amount: 0, count: 0 };
        entry.amount += inc.amount;
        entry.count += 1;
        breakdown.set(category, entry);
      });

      return NextResponse.json({
        data: enrichedIncome,
        total_income: totalIncome,
        breakdown: [...breakdown.entries()].map(([category, data]) => ({
          source: category,
          amount: data.amount,
          count: data.count,
        })),
      });
    } catch (error) {
      console.error('Error fetching income:', error);
      return NextResponse.json(
        { error: 'Failed to fetch income' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return requireOwner(async (req, user) => {
    try {
      const body = await request.json();
      
      const { client_id, amount, description, category, income_date, payment_method, invoice_number, notes } = body;

      if (!client_id || !amount || !description || !category) {
        return NextResponse.json(
          { error: 'Client ID, amount, description, and category are required' },
          { status: 400 }
        );
      }

      // Validate client exists
      const client = await ClientModel.findByNumericId(Number(client_id));
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }

      const income = await IncomeModel.create({
        client_id: Number(client_id),
        client_name: client.name,
        amount: Number(amount),
        description,
        category,
        income_date: new Date(income_date || new Date()),
        status: 'pending',
        payment_method: payment_method || '',
        invoice_number: invoice_number || '',
        notes: notes || '',
        created_by: user.userId,
        created_by_name: user.username || String(user.userId),
      });

      return NextResponse.json(income, { status: 201 });
    } catch (error) {
      console.error('Error creating income:', error);
      return NextResponse.json(
        { error: 'Failed to create income' },
        { status: 500 }
      );
    }
  })(request);
}
