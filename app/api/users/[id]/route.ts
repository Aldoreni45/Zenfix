import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth/middleware';
import { UserModel } from '@/lib/mongodb/models/user';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { UserRole, UserStatus } from '@/lib/types/models';

async function getHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const userDoc = await UserModel.findByNumericId(numericId);
    
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Role-based access check
    if (user.role === UserRole.EMPLOYEE && userDoc.numeric_id !== user.userId) {
      return NextResponse.json(
        { error: 'You can only view your own profile.' },
        { status: 403 }
      );
    }

    let department_name = null;
    if (userDoc.department_id) {
      const dept = await DepartmentModel.findByNumericId(userDoc.department_id);
      department_name = dept?.name || null;
    }

    let reports_to_name = null;
    if (userDoc.reports_to_id) {
      const manager = await UserModel.findByNumericId(userDoc.reports_to_id);
      reports_to_name = manager ? `${manager.first_name} ${manager.last_name}`.trim() || manager.username : null;
    }

    const userResponse = {
      id: userDoc.numeric_id,
      username: userDoc.username,
      email: userDoc.email,
      first_name: userDoc.first_name,
      last_name: userDoc.last_name,
      full_name: `${userDoc.first_name} ${userDoc.last_name}`.trim() || userDoc.username,
      phone: userDoc.phone,
      role: userDoc.role,
      role_name: userDoc.role.charAt(0).toUpperCase() + userDoc.role.slice(1),
      department_id: userDoc.department_id,
      department_name,
      avatar: userDoc.avatar,
      status: userDoc.status,
      status_name: userDoc.status.charAt(0).toUpperCase() + userDoc.status.slice(1),
      is_active: userDoc.is_active,
      last_login: userDoc.last_login?.toISOString(),
      reports_to_id: userDoc.reports_to_id,
      created_at: userDoc.created_at.toISOString(),
      updated_at: userDoc.updated_at.toISOString(),
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function patchHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const userDoc = await UserModel.findByNumericId(numericId);
    
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Permission check
    if (user.role !== UserRole.OWNER && userDoc.numeric_id !== user.userId) {
      return NextResponse.json(
        { error: 'You can only update your own profile.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      first_name,
      last_name,
      phone,
      email,
      avatar,
      department,
      reports_to,
      password,
      confirm_password,
    } = body;

    // Only owner can change roles
    if (body.role && user.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: 'Only the owner can change roles.' },
        { status: 403 }
      );
    }

    // Owner cannot modify another owner
    if (userDoc.role === UserRole.OWNER && user.role !== UserRole.OWNER && userDoc.numeric_id !== user.userId) {
      return NextResponse.json(
        { error: 'Cannot modify the owner.' },
        { status: 403 }
      );
    }

    // Managers cannot create owners
    if (body.role === UserRole.OWNER && user.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: 'Managers cannot create owners.' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (body.role !== undefined) updateData.role = body.role;

    // Handle department
    if (department !== undefined) {
      if (department === null || department === '') {
        updateData.department_id = undefined;
      } else {
        const dept = await DepartmentModel.findByName(department);
        if (!dept) {
          return NextResponse.json(
            { error: `Department '${department}' not found.` },
            { status: 400 }
          );
        }
        updateData.department_id = dept.numeric_id;
      }
    }

    // Handle reports_to
    if (reports_to !== undefined) {
      if (reports_to === null || reports_to === '') {
        updateData.reports_to_id = undefined;
      } else {
        const manager = await UserModel.findByNumericId(reports_to);
        if (!manager) {
          return NextResponse.json(
            { error: 'Reports to user not found.' },
            { status: 400 }
          );
        }
        updateData.reports_to_id = reports_to;
      }
    }

    // Handle password change
    if (password) {
      if (!confirm_password) {
        return NextResponse.json(
          { error: { confirm_password: 'This field is required when setting a password.' } },
          { status: 400 }
        );
      }
      if (password !== confirm_password) {
        return NextResponse.json(
          { error: { confirm_password: 'Passwords do not match.' } },
          { status: 400 }
        );
      }
      const strengthCheck = validatePasswordStrength(password);
      if (!strengthCheck.valid) {
        return NextResponse.json(
          { error: { password: strengthCheck.errors } },
          { status: 400 }
        );
      }
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await UserModel.update(numericId, updateData);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    let department_name = null;
    if (updatedUser.department_id) {
      const dept = await DepartmentModel.findByNumericId(updatedUser.department_id);
      department_name = dept?.name || null;
    }

    const userResponse = {
      id: updatedUser.numeric_id,
      username: updatedUser.username,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      full_name: `${updatedUser.first_name} ${updatedUser.last_name}`.trim() || updatedUser.username,
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
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteHandler(request: NextRequest, user: any, id: string) {
  try {
    if (user.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: 'Only the owner can delete users.' },
        { status: 403 }
      );
    }

    const numericId = parseInt(id);
    const userDoc = await UserModel.findByNumericId(numericId);
    
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (userDoc.role === UserRole.OWNER) {
      return NextResponse.json(
        { error: 'Cannot delete the owner.' },
        { status: 403 }
      );
    }

    await UserModel.delete(numericId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => getHandler(req, user, id))(request);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => patchHandler(req, user, id))(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => deleteHandler(req, user, id))(request);
}
