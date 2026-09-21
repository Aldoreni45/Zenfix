import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { UserModel } from '@/lib/mongodb/models/user';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { formatUserName, getDepartmentNameById } from '@/lib/api-helpers/data-enrichment';
import { handleError } from '@/lib/api-helpers/error-handler';
import { UserRole } from '@/lib/types/models';

async function handler(request: NextRequest, user: any) {
  try {
    const users = await UserModel.findAll({ role: 'manager' });

    const usersWithDetails = await Promise.all(
      users.map(async (u) => {
        const department_name = u.department_id ? await getDepartmentNameById(u.department_id) : null;

        return {
          id: u.numeric_id,
          username: u.username,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          full_name: formatUserName(u),
          phone: u.phone,
          role: u.role,
          role_name: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          department: u.department_id,
          department_name,
          avatar: u.avatar,
          status: u.status,
          status_name: u.status.charAt(0).toUpperCase() + u.status.slice(1),
          is_active: u.status === 'active',
          last_login: u.last_login?.toISOString(),
          reports_to: u.reports_to_id,
          created_at: u.created_at.toISOString(),
          updated_at: u.updated_at.toISOString(),
        };
      })
    );

    return NextResponse.json(usersWithDetails);
  } catch (error) {
    return handleError(error, 'List managers');
  }
}

export const GET = requireAuth(handler);
