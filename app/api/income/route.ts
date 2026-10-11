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

      const filters: any = {};
      if (clientId) filters.client_id = Number(clientId);
      if (status) filters.status = status;

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

      return NextResponse.json(enrichedIncome);
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
        created_by_name: `${user.first_name} ${user.last_name}`,
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
