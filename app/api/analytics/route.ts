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

    // Task completion by status
    const tasksByStatus = await Task.aggregate([
      { $match: userRole === 'admin' ? {} : taskQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Tasks by department
    const tasksByDepartment = await Task.aggregate([
      { $match: userRole === 'admin' ? {} : taskQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'assignee',
        },
      },
      {
        $unwind: '$assignee',
      },
      {
        $group: {
          _id: '$assignee.department',
          count: { $sum: 1 },
        },
      },
    ]);

    // Task completion trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completionTrend = await Task.aggregate([
      {
        $match: {
          ...taskQuery,
          status: 'completed',
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Task completion by day of week (for bar chart)
    const dayOfWeekTrend = await Task.aggregate([
      {
        $match: {
          ...taskQuery,
          status: 'completed',
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$updatedAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Team efficiency (completed tasks per user)
    const teamEfficiency = await Task.aggregate([
      { $match: userRole === 'admin' ? {} : taskQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'assignee',
        },
      },
      {
        $unwind: '$assignee',
      },
      {
        $group: {
          _id: '$assignee',
          name: { $first: '$assignee.name' },
          department: { $first: '$assignee.department' },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          name: 1,
          department: 1,
          total: 1,
          completed: 1,
          efficiency: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
            ],
          },
        },
      },
    ]);

    return NextResponse.json({
      tasksByStatus,
      tasksByDepartment,
      completionTrend,
      dayOfWeekTrend,
      teamEfficiency,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
