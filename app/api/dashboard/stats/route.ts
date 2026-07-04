import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    let taskQuery: any = {};

    if (userRole === 'worker') {
      taskQuery.assignedTo = userId;
    } else if (userRole === 'manager') {
      taskQuery.$or = [{ assignedBy: userId }, { assignedTo: userId }];
    }

    const totalTasks = await Task.countDocuments(taskQuery);
    const completedTasks = await Task.countDocuments({ ...taskQuery, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ ...taskQuery, status: { $in: ['pending', 'in_progress'] } });
    const overdueTasks = await Task.countDocuments({ 
      ...taskQuery, 
      status: { $in: ['pending', 'in_progress'] },
      deadline: { $lt: new Date() }
    });

    let totalUsers = 0;
    if (userRole === 'admin') {
      totalUsers = await User.countDocuments();
    }

    return NextResponse.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      totalUsers,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
