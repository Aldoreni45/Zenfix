import { NextRequest, NextResponse } from 'next/server';
import { TaskModel } from '@/lib/mongodb/models/task';
import { requireAuth } from '@/lib/auth/middleware';
import { isOverdueByDate } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const now = new Date();
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const nextDayStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const weekEnd = new Date(nextDayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const allTasks = await TaskModel.findAll({});
      const myTasks = allTasks.filter(t => t.assigned_to_id === user.userId);

      const summary = {
        total: myTasks.length,
        completed: myTasks.filter(t => t.status === 'completed').length,
        in_progress: myTasks.filter(t => t.status === 'in_progress').length,
        pending: myTasks.filter(t => t.status === 'pending').length,
        overdue: myTasks.filter(t => t.due_date && isOverdueByDate(t.due_date) && t.status !== 'completed').length,
        due_today: myTasks.filter(t => t.due_date && t.due_date >= todayStart && t.due_date < nextDayStart).length,
        due_this_week: myTasks.filter(t => t.due_date && t.due_date >= todayStart && t.due_date < weekEnd).length,
      };

      return NextResponse.json(summary);
    } catch (error) {
      console.error('Error fetching task summary:', error);
      return NextResponse.json(
        { error: 'Failed to fetch task summary' },
        { status: 500 }
      );
    }
  })(request);
}
