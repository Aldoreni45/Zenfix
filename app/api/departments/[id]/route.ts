import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError } from '@/lib/api-helpers/error-handler';

async function getHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const departmentDoc = await DepartmentModel.findByNumericId(numericId);
    
    if (!departmentDoc) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    const departmentResponse = {
      id: departmentDoc.numeric_id,
      name: departmentDoc.name,
      slug: departmentDoc.slug,
      description: departmentDoc.description,
      is_active: departmentDoc.is_active,
      created_at: departmentDoc.created_at.toISOString(),
      updated_at: departmentDoc.updated_at.toISOString(),
    };

    return NextResponse.json(departmentResponse);
  } catch (error) {
    return handleError(error, 'Get department');
  }
}

async function patchHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const departmentDoc = await DepartmentModel.findByNumericId(numericId);
    
    if (!departmentDoc) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, slug, description, is_active } = body;

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedDepartment = await DepartmentModel.update(numericId, updateData);
    
    if (!updatedDepartment) {
      return NextResponse.json(
        { error: 'Failed to update department' },
        { status: 500 }
      );
    }

    const departmentResponse = {
      id: updatedDepartment.numeric_id,
      name: updatedDepartment.name,
      slug: updatedDepartment.slug,
      description: updatedDepartment.description,
      is_active: updatedDepartment.is_active,
      created_at: updatedDepartment.created_at.toISOString(),
      updated_at: updatedDepartment.updated_at.toISOString(),
    };

    return NextResponse.json(departmentResponse);
  } catch (error) {
    return handleError(error, 'Update department');
  }
}

async function deleteHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const departmentDoc = await DepartmentModel.findByNumericId(numericId);
    
    if (!departmentDoc) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    await DepartmentModel.delete(numericId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Delete department');
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireOwner((req, user) => getHandler(req, user, id))(request);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireOwner((req, user) => patchHandler(req, user, id))(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireOwner((req, user) => deleteHandler(req, user, id))(request);
}
