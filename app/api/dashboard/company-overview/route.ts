import { NextRequest, NextResponse } from 'next/server';
import { TaskModel } from '@/lib/mongodb/models/task';
import { ClientModel } from '@/lib/mongodb/models/client';
import { VideoModel } from '@/lib/mongodb/models/video';
import { UserModel } from '@/lib/mongodb/models/user';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { requireOwnerOrManager } from '@/lib/auth/middleware';
import { isOverdueByDate } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const allTasks = await TaskModel.findAll({});
      const allClients = await ClientModel.findAll({});
      const allVideos = await VideoModel.findAll({});
      const allUsers = await UserModel.findAll({});
      const unreadCount = await NotificationModel.countUnread(user.userId);

      const overview = {
        tasks: {
          total: allTasks.length,
          completed: allTasks.filter(t => t.status === 'completed').length,
          in_progress: allTasks.filter(t => t.status === 'in_progress').length,
          pending: allTasks.filter(t => t.status === 'pending').length,
          overdue: allTasks.filter(t => t.due_date && isOverdueByDate(t.due_date) && t.status !== 'completed').length,
        },
        clients: {
          total: allClients.length,
          active: allClients.filter(c => c.status === 'active').length,
          inactive: allClients.filter(c => c.status === 'inactive').length,
        },
        videos: {
          total: allVideos.length,
          posted: allVideos.filter(v => v.status === 'posted').length,
          in_progress: allVideos.filter(v => ['shooting', 'editing', 'review'].includes(v.status)).length,
          pending: allVideos.filter(v => ['idea', 'script'].includes(v.status)).length,
        },
        users: {
          total: allUsers.length,
          owners: allUsers.filter(u => u.role === 'owner').length,
          managers: allUsers.filter(u => u.role === 'manager').length,
          employees: allUsers.filter(u => u.role === 'employee').length,
          active: allUsers.filter(u => u.status === 'active').length,
          inactive: allUsers.filter(u => u.status === 'inactive').length,
        },
        notifications: {
          unread: unreadCount,
        },
      };

      return NextResponse.json(overview);
    } catch (error) {
      console.error('Error fetching company overview:', error);
      return NextResponse.json(
        { error: 'Failed to fetch company overview' },
        { status: 500 }
      );
    }
  })(request);
}
