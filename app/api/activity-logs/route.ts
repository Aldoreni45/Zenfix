import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');

    let query: any = {};

    // Non-admin users can only see their own activity logs
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      query.user = (session.user as any).id;
    }

    if (action) {
      query.action = action;
    }

    if (entity) {
      query.entity = entity;
    }

    const logs = await ActivityLog.find(query)
      .populate('user', 'name email avatar role')
      .sort({ timestamp: -1 })
      .limit(limit);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
