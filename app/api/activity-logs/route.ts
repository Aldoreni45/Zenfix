import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
    const page  = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip  = (page - 1) * limit;
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const search = searchParams.get('search'); // user name search

    const userRole = (session.user as any).role;
    const userId   = (session.user as any).id;

    let query: any = {};

    // Non-admins only see their own logs
    if (userRole !== 'admin') {
      query.user = userId;
    }

    if (action) query.action = action;
    if (entity) query.entity = entity;

    // If search provided, first find matching users then filter by those user IDs
    if (search && userRole === 'admin') {
      const matchingUsers = await User.find({
        $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);
      query.user = { $in: userIds };
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'name email avatar role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(query),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
