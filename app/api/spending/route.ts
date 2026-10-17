import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwnerOrManager } from '@/lib/auth/middleware';
import { SpendingModel } from '@/lib/mongodb/models/spending';
import { ClientModel } from '@/lib/mongodb/models/client';
import { UserModel } from '@/lib/mongodb/models/user';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const clientId = searchParams.get('client_id');
      const employeeId = searchParams.get('employee_id');
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');
      const category = searchParams.get('category');
      const status = searchParams.get('status');

      // Role-based filtering
      const filters: any = {};
      
      if (user.role !== 'owner') {
        // Managers can only see spendings they created or for their assigned clients
        // For now, managers see all (you can restrict further based on business logic)
        filters.created_by = user.userId;
      }

      if (clientId) filters.client_id = Number(clientId);
      if (employeeId) filters.employee_id = Number(employeeId);
      if (category) filters.category = category;
      if (status) filters.status = status;

      if (startDate || endDate) {
        filters.date = {};
        if (startDate) filters.date.$gte = new Date(startDate);
        if (endDate) filters.date.$lte = new Date(endDate);
      }

      const spendings = await SpendingModel.findAll(filters);

      // Enrich with client and employee details
      const enrichedSpendings = await Promise.all(
        spendings.map(async (spending) => {
          const client = spending.client_id ? await ClientModel.findByNumericId(spending.client_id) : null;
          const employee = spending.employee_id ? await UserModel.findByNumericId(spending.employee_id) : null;
          
          return {
            ...spending,
            client_name: client?.name || spending.client_name,
            employee_name: employee?.username || spending.employee_name,
            employee_email: employee?.email || spending.employee_email,
          };
        })
      );

      return NextResponse.json(enrichedSpendings);
    } catch (error) {
      console.error('Error fetching spendings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch spendings' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const body = await request.json();
      const { client_id, employee_id, amount, description, category, location, date, status, receipt_url } = body;

      if (!client_id || !employee_id || !amount || !description || !category || !date) {
        return NextResponse.json(
          { error: 'client_id, employee_id, amount, description, category, and date are required' },
          { status: 400 }
        );
      }

      // Location is mandatory for every spending entry.
      const cleanLocation = typeof location === 'string' ? location.trim() : '';
      if (!cleanLocation) {
        return NextResponse.json(
          { error: 'location is required' },
          { status: 400 }
        );
      }

      // Payment status: 'paid'/'approved' → approved, 'unpaid'/'pending' → pending.
      const normalizedStatus =
        status === 'paid' || status === 'approved'
          ? 'approved'
          : status === 'unpaid' || status === 'pending'
            ? 'pending'
            : null;
      if (status !== undefined && status !== '' && !normalizedStatus) {
        return NextResponse.json(
          { error: "status must be one of: paid, unpaid, approved, pending" },
          { status: 400 }
        );
      }

      // Validate client
      const client = await ClientModel.findByNumericId(client_id);
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 400 }
        );
      }

      // Validate employee
      const employee = await UserModel.findByNumericId(employee_id);
      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 400 }
        );
      }

      const creator = await UserModel.findByNumericId(user.userId);
      const spending = await SpendingModel.create({
        client_id,
        client_name: client.name,
        employee_id,
        employee_name: employee.username,
        employee_email: employee.email,
        amount: Number(amount),
        description,
        category,
        location: cleanLocation,
        date: new Date(date),
        created_by: user.userId,
        created_by_name: creator?.username || user.username,
        notes: '',
        receipt_url: receipt_url || '',
        // 'approved' = already paid, 'pending' = yet to pay.
        status: normalizedStatus || 'approved',
      });

      return NextResponse.json(spending, { status: 201 });
    } catch (error) {
      console.error('Error creating spending:', error);
      return NextResponse.json(
        { error: 'Failed to create spending' },
        { status: 500 }
      );
    }
  })(request);
}
