import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { UserModel } from '@/lib/mongodb/models/user';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { formatUserName, getDepartmentNameById } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const userDoc = await UserModel.findByNumericId(user.userId);
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const department_name = userDoc.department_id ? await getDepartmentNameById(userDoc.department_id) : null;

    const response = {
      id: userDoc.numeric_id,
      username: userDoc.username,
      email: userDoc.email,
      first_name: userDoc.first_name,
      last_name: userDoc.last_name,
      full_name: formatUserName(userDoc),
      phone: userDoc.phone,
      role: userDoc.role,
      role_name: userDoc.role.charAt(0).toUpperCase() + userDoc.role.slice(1),
      department: userDoc.department_id,
      department_name,
      avatar: userDoc.avatar,
      status: userDoc.status,
      status_name: userDoc.status.charAt(0).toUpperCase() + userDoc.status.slice(1),
      is_active: userDoc.status === 'active',
      last_login: formatDate(userDoc.last_login),
      reports_to: userDoc.reports_to_id,
      created_at: userDoc.created_at.toISOString(),
      updated_at: userDoc.updated_at.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error, 'Get current user');
  }
}

export const GET = requireAuth(handler);
