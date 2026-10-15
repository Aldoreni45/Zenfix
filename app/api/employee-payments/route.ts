import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { EmployeePaymentModel } from '@/lib/mongodb/models/employee-payment';
import { UserModel } from '@/lib/mongodb/models/user';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const employeeId = searchParams.get('employee_id');
      const status = searchParams.get('status');

      const filters: any = {};
      if (employeeId) filters.employee_id = Number(employeeId);
      if (status) filters.status = status;

      const payments = await EmployeePaymentModel.findAll(filters);
      
      // Enrich with employee details
      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          if (payment.employee_id) {
            const employee = await UserModel.findByNumericId(payment.employee_id);
            return {
              ...payment,
              employee_name: employee?.username || payment.employee_name,
              employee_email: employee ? employee.email : payment.employee_email,
            };
          }
          return payment;
        })
      );

      return NextResponse.json(enrichedPayments);
    } catch (error) {
      console.error('Error fetching employee payments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employee payments' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return requireOwner(async (req, user) => {
    try {
      const body = await request.json();
      
      const { employee_id, total_spending, amount_paid, notes } = body;

      if (!employee_id || !total_spending) {
        return NextResponse.json(
          { error: 'Employee ID and total spending are required' },
          { status: 400 }
        );
      }

      // Validate employee exists
      const employee = await UserModel.findByNumericId(Number(employee_id));
      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      const amount_pending = Number(total_spending) - Number(amount_paid || 0);
      let status: 'pending' | 'partial' | 'completed' = 'pending';
      if (amount_paid > 0 && amount_pending > 0) status = 'partial';
      if (amount_pending <= 0) status = 'completed';

      const creator = await UserModel.findByNumericId(user.userId);
      const payment = await EmployeePaymentModel.create({
        employee_id: Number(employee_id),
        employee_name: employee.username,
        employee_email: employee.email,
        total_spending: Number(total_spending),
        amount_paid: Number(amount_paid || 0),
        amount_pending,
        status,
        notes: notes || '',
        created_by: user.userId,
        created_by_name: creator?.username || user.username,
      });

      return NextResponse.json(payment, { status: 201 });
    } catch (error) {
      console.error('Error creating employee payment:', error);
      return NextResponse.json(
        { error: 'Failed to create employee payment' },
        { status: 500 }
      );
    }
  })(request);
}
