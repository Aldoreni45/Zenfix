import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { UserModel } from '@/lib/mongodb/models/user';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { ActivityAction } from '@/lib/types/models';
import { UserRole, UserStatus } from '@/lib/types/models';
import { normalizePhone, isValidPhone, PHONE_ERROR } from '@/lib/validation';
import { formatUserName } from '@/lib/api-helpers/data-enrichment';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    const filters: any = {};
    
    // Role-based filtering
    if (user.role === UserRole.OWNER) {
      // Owner sees all
    } else if (user.role === UserRole.MANAGER) {
      // Manager sees managers and employees
      filters.role = { $in: [UserRole.MANAGER, UserRole.EMPLOYEE] };
    } else {
      // Employee sees only themselves
      filters.numeric_id = user.userId;
    }

    // Apply additional filters
    if (role) filters.role = role;
    if (status) filters.status = status;
    if (department) filters.department_id = parseInt(department);
    
    // Search
    let users;
    if (search) {
      users = await UserModel.findAll({
        ...filters,
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      });
    } else {
      users = await UserModel.findAll(filters);
    }

    // Fetch department names and reports_to names
    const usersWithDetails = await Promise.all(
      users.map(async (u) => {
        let department_name = null;
        if (u.department_id) {
          const dept = await DepartmentModel.findByNumericId(u.department_id);
          department_name = dept?.name || null;
        }

        let reports_to_name = null;
        if (u.reports_to_id) {
          const manager = await UserModel.findByNumericId(u.reports_to_id);
          reports_to_name = manager ? manager.username : null;
        }

        return {
          id: u.numeric_id,
          username: u.username,
          email: u.email,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          full_name: formatUserName(u),
          phone: u.phone,
          role: u.role,
          role_name: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          department_id: u.department_id,
          department_name,
          avatar: u.avatar,
          status: u.status,
          status_name: u.status.charAt(0).toUpperCase() + u.status.slice(1),
          is_active: u.is_active,
          last_login: u.last_login?.toISOString(),
          reports_to: u.reports_to_id,
          reports_to_id: u.reports_to_id,
          created_at: u.created_at.toISOString(),
          updated_at: u.updated_at.toISOString(),
        };
      })
    );

    return NextResponse.json(usersWithDetails);
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createHandler(request: NextRequest, user: any) {
  try {
    if (user.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: 'Only the owner can create users.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      username,
      email,
      phone,
      role = UserRole.EMPLOYEE,
      status = UserStatus.ACTIVE,
      department,
      reports_to,
      password,
      confirm_password,
    } = body;

    // Username, email, phone, role and password are required for every new user.
    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim();
    const cleanPhone = normalizePhone(phone);

    const requiredErrors: Record<string, string> = {};
    if (!cleanUsername) requiredErrors.username = 'Username is required.';
    if (!cleanEmail) requiredErrors.email = 'Email is required.';
    if (!cleanPhone) requiredErrors.phone = 'Phone is required.';
    else if (!isValidPhone(cleanPhone)) requiredErrors.phone = PHONE_ERROR;
    if (!role) requiredErrors.role = 'Role is required.';
    if (!password) requiredErrors.password = 'Password is required.';
    else if (!confirm_password) requiredErrors.confirm_password = 'Please confirm the password.';
    else if (password !== confirm_password) requiredErrors.confirm_password = 'Passwords do not match.';

    if (Object.keys(requiredErrors).length > 0) {
      return NextResponse.json({ error: requiredErrors }, { status: 400 });
    }

    // Basic email format validation.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: { email: 'Please enter a valid email address.' } },
        { status: 400 }
      );
    }

    // Check if username exists
    const existingUsername = await UserModel.findByUsername(cleanUsername);
    if (existingUsername) {
      return NextResponse.json(
        { error: { username: 'Username already exists.' } },
        { status: 400 }
      );
    }

    // Check if email exists
    const existingEmail = await UserModel.findByEmail(cleanEmail);
    if (existingEmail) {
      return NextResponse.json(
        { error: { email: 'Email already exists.' } },
        { status: 400 }
      );
    }

    // Validate role
    if (role === UserRole.OWNER) {
      return NextResponse.json(
        { error: { role: 'Cannot create an owner.' } },
        { status: 403 }
      );
    }
    if (role !== UserRole.EMPLOYEE && role !== UserRole.MANAGER) {
      return NextResponse.json(
        { error: { role: "Role must be 'manager' or 'employee'." } },
        { status: 400 }
      );
    }

    // Validate department
    let department_id = null;
    if (department) {
      const dept = await DepartmentModel.findByName(department);
      if (!dept) {
        return NextResponse.json(
          { error: { department: `Department '${department}' not found.` } },
          { status: 400 }
        );
      }
      department_id = dept.numeric_id;
    }

    // Validate password strength and hash it.
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        { error: { password: strengthCheck.errors } },
        { status: 400 }
      );
    }
    const hashedPassword = await hashPassword(password);

    // Validate reports_to
    let reports_to_id = null;
    if (reports_to) {
      const manager = await UserModel.findByNumericId(reports_to);
      if (!manager) {
        return NextResponse.json(
          { error: { reports_to: 'Reports to user not found.' } },
          { status: 400 }
        );
      }
      reports_to_id = reports_to;
    }

    const newUser = await UserModel.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      phone: cleanPhone,
      role,
      status,
      department_id: department_id || undefined,
      reports_to_id: reports_to_id || undefined,
    });

    if (!newUser || !newUser.numeric_id) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Log activity
    await ActivityLogModel.create({
      actor_id: user.userId,
      action: ActivityAction.CREATE,
      entity_type: 'user',
      entity_id: newUser.numeric_id.toString(),
      description: `Created user ${newUser.username}`,
      metadata: {},
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      user_agent: request.headers.get('user-agent')?.substring(0, 300) || '',
    });

    // Send notification
    await NotificationModel.create({
      recipient_id: newUser.numeric_id,
      notification_type: 'user_assigned',
      title: 'Account created',
      message: 'Your ZenFix account is ready.',
      is_read: false,
      related_object_type: 'user',
      related_object_id: newUser.numeric_id.toString(),
      link: '',
      priority: 'normal',
    });

    const userResponse = {
      id: newUser.numeric_id,
      username: newUser.username,
      email: newUser.email,
      first_name: newUser.first_name || '',
      last_name: newUser.last_name || '',
      full_name: formatUserName(newUser),
      phone: newUser.phone,
      role: newUser.role,
      role_name: newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1),
      department_id: newUser.department_id,
      avatar: newUser.avatar,
      status: newUser.status,
      status_name: newUser.status.charAt(0).toUpperCase() + newUser.status.slice(1),
      is_active: newUser.is_active,
      last_login: newUser.last_login?.toISOString(),
      reports_to_id: newUser.reports_to_id || undefined,
      created_at: newUser.created_at.toISOString(),
      updated_at: newUser.updated_at.toISOString(),
    };

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(handler);
export const POST = requireAuth(createHandler);
