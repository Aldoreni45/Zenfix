import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { SpendingModel } from '@/lib/mongodb/models/spending';
import { EmployeePaymentModel } from '@/lib/mongodb/models/employee-payment';
import { UserModel } from '@/lib/mongodb/models/user';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      // Get all spendings to group by employee
      const allSpendings = await SpendingModel.findAll();
      
      // Group by employee_id and get employee names from the spending records
      const employeeMap = new Map();
      allSpendings.forEach((spending) => {
        const empId = spending.employee_id;
        if (!employeeMap.has(empId)) {
          employeeMap.set(empId, {
            employee_id: empId,
            employee_name: spending.employee_name || 'Unknown',
            employee_email: spending.employee_email || '',
            total_spending: 0,
            pending_spending: 0,
          });
        }
        const emp = employeeMap.get(empId);
        emp.total_spending += spending.amount;
        // Only "Yet to Pay" (pending) spendings are owed.
        // "Already Paid" (approved) spendings are excluded — they are settled.
        if (spending.status === 'pending') emp.pending_spending += spending.amount;
      });
      
      // Get all manual payment records
      const manualPayments = await EmployeePaymentModel.findAll();
      
      // Create a map of employee IDs to manual payments
      const manualPaymentMap = new Map();
      manualPayments.forEach((payment) => {
        manualPaymentMap.set(payment.employee_id, payment);
      });
      
      // Combine spending data with manual payment data
      const employeeSummaries = Array.from(employeeMap.values()).map((employeeData) => {
        const manualPayment = manualPaymentMap.get(employeeData.employee_id);
        const totalSpending = employeeData.total_spending;
        const amountPaid = manualPayment?.amount_paid || 0;
        // What is actually owed = sum of "Yet to Pay" spendings only.
        // Spendings added as "Already Paid" never show up here.
        const amountPending = employeeData.pending_spending;
        const status: 'pending' | 'partial' | 'completed' =
          amountPending <= 0 ? 'completed' : amountPaid > 0 ? 'partial' : 'pending';

        return {
          employee_id: employeeData.employee_id,
          employee_name: employeeData.employee_name,
          employee_email: employeeData.employee_email,
          total_spending: totalSpending,
          amount_paid: amountPaid,
          amount_pending: amountPending,
          status,
          payment_date: manualPayment?.payment_date || null,
          notes: manualPayment?.notes || '',
          has_manual_payment: !!manualPayment,
          manual_payment_id: manualPayment?.numeric_id || null,
        };
      });
      
      return NextResponse.json(employeeSummaries);
    } catch (error) {
      console.error('Error fetching employee payment summary:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employee payment summary' },
        { status: 500 }
      );
    }
  })(request);
}
