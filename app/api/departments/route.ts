import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError, handleValidationError, handleForbidden } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    // Django: All authenticated users can view departments
    const departments = await DepartmentModel.findAll();

    const departmentsResponse = departments.map(d => ({
      id: d.numeric_id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      is_active: d.is_active,
      created_at: d.created_at.toISOString(),
      updated_at: d.updated_at.toISOString(),
    }));

    return NextResponse.json(departmentsResponse);
  } catch (error) {
    return handleError(error, 'List departments');
  }
}

async function createHandler(request: NextRequest, user: any) {
  try {
    // Django: Only owner can manage departments
    if (user.role !== 'owner') {
      return handleForbidden('Only the owner can manage departments.');
    }

    const body = await request.json();
    const { name, slug, description, is_active = true } = body;

    if (!name) {
      return handleValidationError('Name is required');
    }

    // Generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newDepartment = await DepartmentModel.create({
      name,
      slug: finalSlug,
      description,
      is_active,
    });

    const departmentResponse = {
      id: newDepartment.numeric_id,
      name: newDepartment.name,
      slug: newDepartment.slug,
      description: newDepartment.description,
      is_active: newDepartment.is_active,
      created_at: newDepartment.created_at.toISOString(),
      updated_at: newDepartment.updated_at.toISOString(),
    };

    return NextResponse.json(departmentResponse, { status: 201 });
  } catch (error) {
    return handleError(error, 'Create department');
  }
}

export const GET = requireAuth(handler);
export const POST = requireAuth(createHandler);
