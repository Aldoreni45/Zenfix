import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerOrManager } from '@/lib/auth/middleware';
import { ClientModel } from '@/lib/mongodb/models/client';
import { SpendingModel } from '@/lib/mongodb/models/spending';
import { IncomeModel } from '@/lib/mongodb/models/income';
import { UserModel } from '@/lib/mongodb/models/user';

/**
 * Consolidated ledger for a single client.
 *
 * Returns every transaction tied to the client so the client detail page can
 * show "all the spending and income that came from the client" in one place:
 *
 *  - income   → money received FROM the client (credits)
 *  - spending → money spent ON the client (debits)
 *
 * Both are returned as a single date-sorted list plus a `summary` block with
 * the totals the UI renders in its stat cards.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return requireOwnerOrManager(async () => {
    try {
      const clientId = Number(id);
      if (!Number.isFinite(clientId)) {
        return NextResponse.json({ error: 'Invalid client id' }, { status: 400 });
      }

      const client = await ClientModel.findByNumericId(clientId);
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      const [spendings, income] = await Promise.all([
        SpendingModel.findByClient(clientId),
        IncomeModel.findByClient(clientId),
      ]);

      // Enrich spending rows with the employee that incurred the expense.
      const transactions = await Promise.all([
        ...spendings.map(async (spending) => {
          const employee = spending.employee_id
            ? await UserModel.findByNumericId(spending.employee_id)
            : null;

          return {
            id: `spending-${spending.numeric_id}`,
            numeric_id: spending.numeric_id,
            type: 'spending' as const,
            date: spending.date,
            category: spending.category || 'Uncategorized',
            description: spending.description || '',
            party_name: employee?.username || spending.employee_name || '—',
            party_email: employee?.email || spending.employee_email || '',
            location: spending.location || '',
            notes: spending.notes || '',
            amount: spending.amount || 0,
            status: spending.status,
            created_by_name: spending.created_by_name || '',
          };
        }),
        ...income.map(async (entry) => ({
          id: `income-${entry.numeric_id}`,
          numeric_id: entry.numeric_id,
          type: 'income' as const,
          date: entry.income_date,
          category: entry.category || 'Uncategorized',
          description: entry.description || '',
          party_name: entry.payment_method || '—',
          party_email: '',
          location: '',
          notes: entry.notes || '',
          amount: entry.amount || 0,
          status: entry.status,
          invoice_number: entry.invoice_number || '',
          created_by_name: entry.created_by_name || '',
        })),
      ]);

      // Newest first.
      transactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const totalIncome = income.reduce((sum, entry) => sum + (entry.amount || 0), 0);
      const totalSpending = spendings.reduce((sum, entry) => sum + (entry.amount || 0), 0);

      return NextResponse.json({
        client: {
          id: client.numeric_id,
          name: client.name,
        },
        summary: {
          total_income: totalIncome,
          total_spending: totalSpending,
          net: totalIncome - totalSpending,
          transaction_count: transactions.length,
          income_count: income.length,
          spending_count: spendings.length,
          pending_income: income
            .filter((entry) => entry.status === 'pending')
            .reduce((sum, entry) => sum + (entry.amount || 0), 0),
          pending_spending: spendings
            .filter((entry) => entry.status === 'pending')
            .reduce((sum, entry) => sum + (entry.amount || 0), 0),
        },
        transactions,
      });
    } catch (error) {
      console.error('Error fetching client transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch client transactions' },
        { status: 500 }
      );
    }
  })(request);
}
