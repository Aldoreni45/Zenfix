import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { MonthlyTargetModel } from '@/lib/mongodb/models/monthly-target';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { TargetType } from '@/lib/types/models';
import { formatUserName, getClientNameById } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError, handleValidationError, handleForbidden } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const type = searchParams.get('type');
    const user_filter = searchParams.get('user');
    const department = searchParams.get('department');
    const client = searchParams.get('client');

    const filters: any = {};
    
    // Role-based filtering
    if (user.role === 'owner' || user.role === 'manager') {
      // See all
    } else {
      filters.user_id = user.userId;
    }

    if (year) filters.year = parseInt(year);
    if (month) filters.month = parseInt(month);
    if (type) filters.target_type = type;
    if (user_filter) filters.user_id = parseInt(user_filter);
    if (department) filters.department_id = parseInt(department);
    if (client) filters.client_id = parseInt(client);

    const targets = await MonthlyTargetModel.findAll(filters);

    const targetsWithDetails = await Promise.all(
      targets.map(async (t) => {
        let user_name = null;
        if (t.user_id) {
          const user = await UserModel.findByNumericId(t.user_id);
          user_name = user ? `${user.first_name} ${user.last_name}`.trim() || user.username : null;
        }

        let client_name = null;
        if (t.client_id) {
          const client = await ClientModel.findByNumericId(t.client_id);
          client_name = client?.name || null;
        }

        const remaining_videos = t.target_videos - t.posted_videos;
        const progress_percentage = t.target_videos > 0 ? Math.round((t.posted_videos / t.target_videos) * 100) : 0;

        return {
          id: t.numeric_id,
          user_id: t.user_id,
          department_id: t.department_id,
          client_id: t.client_id,
          client_name,
          month: t.month,
          year: t.year,
          target_type: t.target_type,
          target_value: t.target_value,
          achieved_value: t.achieved_value,
          target_videos: t.target_videos,
          completed_videos: t.completed_videos,
          posted_videos: t.posted_videos,
          pending_videos: t.pending_videos,
          in_production_videos: t.in_production_videos,
          waiting_approval_videos: t.waiting_approval_videos,
          remaining_videos,
          progress_percentage,
          year_month: `${t.year}-${t.month.toString().padStart(2, '0')}`,
          notes: t.notes,
          start_date: t.start_date?.toISOString(),
          end_date: t.end_date?.toISOString(),
          created_by_id: t.created_by_id,
          created_at: t.created_at.toISOString(),
          updated_at: t.updated_at.toISOString(),
        };
      })
    );

    return NextResponse.json(targetsWithDetails);
  } catch (error) {
    return handleError(error, 'List targets');
  }
}

async function createHandler(request: NextRequest, user: any) {
  try {
    if (user.role === 'employee') {
      return handleForbidden('Employees cannot create targets');
    }

    const body = await request.json();
    const {
      user: user_id,
      department,
      client,
      month,
      year,
      target_type,
      target_value,
      target_videos,
      notes,
      start_date,
      end_date,
    } = body;

    if (!month || !year || !target_type) {
      return handleValidationError('month, year, and target_type are required');
    }

    // Validate client
    let client_id = null;
    if (client) {
      const clientDoc = await ClientModel.findByNumericId(client);
      if (!clientDoc) {
        return handleValidationError('Client not found');
      }
      client_id = clientDoc.numeric_id;
    }

    const newTarget = await MonthlyTargetModel.create({
      user_id: user_id ? parseInt(user_id) : undefined,
      department_id: department ? parseInt(department) : undefined,
      client_id: client_id || undefined,
      month,
      year,
      target_type,
      target_value: target_value || 0,
      achieved_value: 0,
      target_videos: target_videos || 0,
      completed_videos: 0,
      posted_videos: 0,
      pending_videos: target_videos || 0,
      in_production_videos: 0,
      waiting_approval_videos: 0,
      notes,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      created_by_id: user.userId,
    });

    let client_name = null;
    if (newTarget.client_id) {
      const client = await ClientModel.findByNumericId(newTarget.client_id);
      client_name = client?.name || null;
    }

    const remaining_videos = newTarget.target_videos - newTarget.posted_videos;
    const progress_percentage = newTarget.target_videos > 0 ? Math.round((newTarget.posted_videos / newTarget.target_videos) * 100) : 0;

    const targetResponse = {
      id: newTarget.numeric_id,
      user_id: newTarget.user_id,
      department_id: newTarget.department_id,
      client_id: newTarget.client_id,
      client_name,
      month: newTarget.month,
      year: newTarget.year,
      target_type: newTarget.target_type,
      target_value: newTarget.target_value,
      achieved_value: newTarget.achieved_value,
      target_videos: newTarget.target_videos,
      completed_videos: newTarget.completed_videos,
      posted_videos: newTarget.posted_videos,
      pending_videos: newTarget.pending_videos,
      in_production_videos: newTarget.in_production_videos,
      waiting_approval_videos: newTarget.waiting_approval_videos,
      remaining_videos,
      progress_percentage,
      year_month: `${newTarget.year}-${newTarget.month.toString().padStart(2, '0')}`,
      notes: newTarget.notes,
      start_date: newTarget.start_date?.toISOString(),
      end_date: newTarget.end_date?.toISOString(),
      created_by_id: newTarget.created_by_id,
      created_at: newTarget.created_at.toISOString(),
      updated_at: newTarget.updated_at.toISOString(),
    };

    return NextResponse.json(targetResponse, { status: 201 });
  } catch (error) {
    return handleError(error, 'Create target');
  }
}

export const GET = requireAuth(handler);
export const POST = requireAuth(createHandler);
