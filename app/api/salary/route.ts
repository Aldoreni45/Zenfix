import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { SalaryModel } from '@/lib/mongodb/models/salary';
import { UserModel } from '@/lib/mongodb/models/user';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const employeeId = searchParams.get('employee_id');
      const month = searchParams.get('month');

      const filters: any = {};
      if (employeeId) filters.employee_id = Number(employeeId);
      if (month) filters.month = month;

      const salaries = await SalaryModel.findAll(filters);
      
      // Enrich with employee details
      const enrichedSalaries = await Promise.all(
        salaries.map(async (salary) => {
          if (salary.employee_id) {
            const employee = await UserModel.findByNumericId(salary.employee_id);
            return {
              ...salary,
              employee_name: employee ? `${employee.first_name} ${employee.last_name}` : salary.employee_name,
              employee_email: employee ? employee.email : salary.employee_email,
            };
          }
          return salary;
        })
      );

      return NextResponse.json(enrichedSalaries);
    } catch (error) {
      console.error('Error fetching salaries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch salaries' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return requireOwner(async (req, user) => {
    try {
      const body = await request.json();
      
      const { employee_id, amount, month, notes } = body;

      if (!employee_id || !amount || !month) {
        return NextResponse.json(
          { error: 'Employee ID, amount, and month are required' },
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

      // Check if salary already exists for this employee and month
      const existing = await SalaryModel.getSalaryByEmployeeAndMonth(Number(employee_id), month);
      if (existing) {
        return NextResponse.json(
          { error: 'Salary already exists for this employee and month' },
          { status: 400 }
        );
      }

      const salary = await SalaryModel.create({
        employee_id: Number(employee_id),
        employee_name: `${employee.first_name} ${employee.last_name}`,
        employee_email: employee.email,
        amount: Number(amount),
        month,
        status: 'paid',
        paid_date: new Date(),
        notes: notes || '',
        created_by: user.userId,
        created_by_name: String(user.userId),
      });

      return NextResponse.json(salary, { status: 201 });
    } catch (error) {
      console.error('Error creating salary:', error);
      return NextResponse.json(
        { error: 'Failed to create salary' },
        { status: 500 }
      );
    }
  })(request);
}
