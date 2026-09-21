import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { UserModel } from '@/lib/mongodb/models/user';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { formatUserName, getDepartmentNameById } from '@/lib/api-helpers/data-enrichment';
import { handleError, handleValidationError, handleForbidden } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { ActivityAction } from '@/lib/types/models';
import { UserRole } from '@/lib/types/models';

async function handler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const targetUser = await UserModel.findByNumericId(numericId);
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { role: newRole } = body;

    if (!['owner', 'manager', 'employee'].includes(newRole)) {
      return handleValidationError('Invalid role');
    }

    // Cannot demote self
    if (parseInt(id) === user.userId && newRole !== 'owner') {
      return handleForbidden('You cannot demote yourself');
    }

    const updatedUser = await UserModel.update(numericId, { role: newRole });
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    // Log activity
    await logActivity({
      actorId: user.userId,
      action: 'ROLE_CHANGE',
      entityType: 'user',
      entityId: updatedUser.numeric_id.toString(),
      description: `User role changed from ${targetUser.role} to ${newRole}`,
      metadata: { old_role: targetUser.role, new_role: newRole },
      request,
    });

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
    return handleError(error, 'Update role');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireOwner((req, user) => handler(req, user, id))(request);
}
