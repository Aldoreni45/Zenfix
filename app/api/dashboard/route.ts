import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { VideoModel } from '@/lib/mongodb/models/video';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { ApprovalModel } from '@/lib/mongodb/models/approval';
import { MonthlyTargetModel } from '@/lib/mongodb/models/monthly-target';
import { UserRole, TaskStatus, ApprovalStatus } from '@/lib/types/models';
import { handleError } from '@/lib/api-helpers/error-handler';
import { getPipelineVideoStats } from '@/lib/api-helpers/video-protocol';

async function handler(request: NextRequest, user: any) {
  try {
    const now = new Date();
    // Day boundaries at UTC midnight so "today" / "overdue" do not shift with
    // the server timezone (due dates are stored at UTC midnight).
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Common calculations
    const allUserTasks = await TaskModel.findAll({ assigned_to_id: user.userId });
    const todayTasks = allUserTasks.filter(t => 
      t.due_date && t.due_date >= startOfToday && t.due_date < endOfToday
    );

    const completedToday = todayTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgressToday = todayTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pendingToday = todayTasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.ASSIGNED).length;

    const pendingTasks = allUserTasks.filter(t => 
      t.status === TaskStatus.PENDING || t.status === TaskStatus.ASSIGNED
    );

    const overdueTasks = allUserTasks.filter(t => 
      t.due_date && t.due_date < startOfToday && 
      t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
    );

    const unreadNotifications = await NotificationModel.countUnread(user.userId);

    let response: any = {
      role: user.role,
      today_tasks: todayTasks.length,
      completed_today: completedToday,
      in_progress_today: inProgressToday,
      pending_today: pendingToday,
      pending_previous: pendingTasks.length,
      pending_tasks: pendingTasks.length,
      overdue_tasks: overdueTasks.length,
      unread_notifications: unreadNotifications,
      waiting_approval: 0,
      videos_completed: 0,
      videos_posted: 0,
      videos_remaining: 0,
    };

    // Role-specific data
    const currentMonth = now.getUTCMonth() + 1;
    const currentYear = now.getUTCFullYear();
    const monthTargets = await MonthlyTargetModel.findAll({ month: currentMonth, year: currentYear });
    const pipeline = await getPipelineVideoStats();

    // Video KPIs derive from the video-protocol pipeline (zf_video_records /
    // zf_video_stages) so work done there immediately shows on the dashboard.
    response.videos_completed = pipeline.posted;
    response.videos_posted = pipeline.posted;
    response.videos_remaining = Math.max(0, pipeline.total - pipeline.posted);
    response.waiting_approval = pipeline.waiting_approval;

    if (user.role === UserRole.OWNER) {
      const totalUsers = await UserModel.findAll();
      const managers = totalUsers.filter(u => u.role === UserRole.MANAGER).length;
      const employees = totalUsers.filter(u => u.role === UserRole.EMPLOYEE).length;
      const totalClients = await ClientModel.findAll();
      const activeClients = totalClients.filter(c => c.status === 'active').length;
      const allTasks = await TaskModel.findAll();
      const pendingApprovals = await ApprovalModel.findAll({ status: ApprovalStatus.PENDING });
      const totalMonthlyTarget = monthTargets.reduce((sum, t) => sum + (t.target_videos || 0), 0)
        || totalClients.reduce((sum, c) => sum + (c.monthly_video_target || 0), 0);

      response = {
        ...response,
        total_users: totalUsers.length,
        managers,
        employees,
        total_clients: totalClients.length,
        active_clients: activeClients,
        total_monthly_target: totalMonthlyTarget,
        tasks: allTasks.length,
        pending_approvals: pendingApprovals.length,
        video_workflow: {
          total: pipeline.total,
          approved: pipeline.posted,
          posted: pipeline.posted,
          waiting: pipeline.waiting_approval,
        },
      };
    } else if (user.role === UserRole.MANAGER) {
      const assignedClients = await ClientModel.findAll({ assigned_manager_id: user.userId });
      const activeClients = assignedClients.filter(c => c.status === 'active').length;
      const assignedIds = new Set(assignedClients.map(c => c.numeric_id as number));
      const teamMembers = await UserModel.findAll({ reports_to_id: user.userId });
      const allTasks = await TaskModel.findAll();
      const pendingApprovals = await ApprovalModel.findAll({ status: ApprovalStatus.PENDING });
      const totalMonthlyTarget = monthTargets
        .filter(t => assignedIds.has(t.client_id as number))
        .reduce((sum, t) => sum + (t.target_videos || 0), 0)
        || assignedClients.reduce((sum, c) => sum + (c.monthly_video_target || 0), 0);

      response = {
        ...response,
        assigned_clients: assignedClients.length,
        total_clients: assignedClients.length,
        active_clients: activeClients,
        total_monthly_target: totalMonthlyTarget,
        team_members: teamMembers.length,
        approvals: pendingApprovals.length,
        workflow_statistics: {
          total: pipeline.total,
          approved: pipeline.posted,
          posted: pipeline.posted,
          waiting: pipeline.waiting_approval,
        },
        workload: {
          total: allTasks.filter(t => t.assigned_to_id && teamMembers.map(m => m.numeric_id).includes(t.assigned_to_id)).length,
          assigned_clients: assignedClients.length,
          employees: await Promise.all(
            teamMembers.map(async (m) => {
              const memberTasks = await TaskModel.findAll({ assigned_to_id: m.numeric_id });
              return {
                id: m.numeric_id,
                name: `${m.first_name} ${m.last_name}`.trim() || m.username,
                role: m.role,
                pending_tasks: memberTasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.ASSIGNED).length,
              };
            })
          ),
        },
      };
    } else {
      // Employee
      const ownTasks = await TaskModel.findAll({ assigned_to_id: user.userId });
      const completed = ownTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const assignedVideos = await VideoModel.findAll({ assigned_to_id: user.userId });

      response = {
        ...response,
        own_tasks: ownTasks.length,
        completed_tasks: completed,
        assigned_videos: assignedVideos.length,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error, 'Dashboard');
  }
}

export const GET = requireAuth(handler);
