import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { UserModel } from '@/lib/mongodb/models/user';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { formatUserName, getDepartmentNameById } from '@/lib/api-helpers/data-enrichment';
import { handleError, handleValidationError } from '@/lib/api-helpers/error-handler';
import { UserStatus } from '@/lib/types/models';

async function handler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const userDoc = await UserModel.findByNumericId(numericId);
    
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status: newStatus } = body;

    if (!['active', 'inactive', 'suspended'].includes(newStatus)) {
      return handleValidationError('Invalid status');
    }

    const updatedUser = await UserModel.update(numericId, { status: newStatus });
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      );
    }

    const department_name = updatedUser.department_id ? await getDepartmentNameById(updatedUser.department_id) : null;

    const userResponse = {
      id: updatedUser.numeric_id,
      username: updatedUser.username,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      full_name: formatUserName(updatedUser),
      phone: updatedUser.phone,
      role: updatedUser.role,
      role_name: updatedUser.role.charAt(0).toUpperCase() + updatedUser.role.slice(1),
      department_id: updatedUser.department_id,
      department_name,
      avatar: updatedUser.avatar,
      status: updatedUser.status,
      status_name: updatedUser.status.charAt(0).toUpperCase() + updatedUser.status.slice(1),
      is_active: updatedUser.is_active,
      last_login: updatedUser.last_login?.toISOString(),
      reports_to_id: updatedUser.reports_to_id,
      created_at: updatedUser.created_at.toISOString(),
      updated_at: updatedUser.updated_at.toISOString(),
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    return handleError(error, 'Update status');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireOwner((req, user) => handler(req, user, id))(request);
}
