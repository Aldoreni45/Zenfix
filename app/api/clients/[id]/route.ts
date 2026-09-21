import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { ClientModel } from '@/lib/mongodb/models/client';
import { UserModel } from '@/lib/mongodb/models/user';
import { formatUserName } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError, handleValidationError } from '@/lib/api-helpers/error-handler';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';

async function getHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const clientDoc = await ClientModel.findByNumericId(numericId);
    
    if (!clientDoc) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    let manager_name = null;
    let manager_email = null;
    if (clientDoc.assigned_manager_id) {
      const manager = await UserModel.findByNumericId(clientDoc.assigned_manager_id);
      if (manager) {
        manager_name = `${manager.first_name} ${manager.last_name}`.trim() || manager.username;
        manager_email = manager.email;
      }
    }

    const clientResponse = {
      id: clientDoc.numeric_id,
      name: clientDoc.name,
      company_name: clientDoc.company_name,
      contact_person: clientDoc.contact_person,
      email: clientDoc.email,
      phone: clientDoc.phone,
      website: clientDoc.website,
      industry: clientDoc.industry,
      description: clientDoc.description,
      address: clientDoc.address,
      instagram_username: clientDoc.instagram_username,
      instagram_url: clientDoc.instagram_url,
      notes: clientDoc.notes,
      status: clientDoc.status,
      status_name: clientDoc.status.charAt(0).toUpperCase() + clientDoc.status.slice(1).replace('_', ' '),
      assigned_manager_id: clientDoc.assigned_manager_id,
      manager_name,
      manager_email,
      manager_id: clientDoc.assigned_manager_id,
      assigned_team: clientDoc.assigned_team_ids,
      start_date: clientDoc.start_date?.toISOString(),
      end_date: clientDoc.end_date?.toISOString(),
      monthly_video_target: clientDoc.monthly_video_target,
      created_by_id: clientDoc.created_by_id,
      created_at: clientDoc.created_at.toISOString(),
      updated_at: clientDoc.updated_at.toISOString(),
    };

    return NextResponse.json(clientResponse);
  } catch (error) {
    return handleError(error, 'Get client');
  }
}

async function patchHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const clientDoc = await ClientModel.findByNumericId(numericId);
    
    if (!clientDoc) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      company_name,
      contact_person,
      email,
      phone,
      website,
      industry,
      description,
      address,
      instagram_username,
      instagram_url,
      notes,
      status,
      assigned_manager,
      assigned_team,
      start_date,
      end_date,
      monthly_video_target,
    } = body;

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (company_name !== undefined) updateData.company_name = company_name;
    if (contact_person !== undefined) updateData.contact_person = contact_person;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (website !== undefined) updateData.website = website;
    if (industry !== undefined) updateData.industry = industry;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (instagram_username !== undefined) updateData.instagram_username = instagram_username;
    if (instagram_url !== undefined) updateData.instagram_url = instagram_url;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (assigned_team !== undefined) updateData.assigned_team_ids = assigned_team;
    if (monthly_video_target !== undefined) updateData.monthly_video_target = monthly_video_target;
    if (start_date !== undefined) updateData.start_date = start_date ? new Date(start_date) : undefined;
    if (end_date !== undefined) updateData.end_date = end_date ? new Date(end_date) : undefined;

    // Handle assigned_manager
    if (assigned_manager !== undefined) {
      if (assigned_manager === null || assigned_manager === '') {
        updateData.assigned_manager_id = undefined;
      } else if (assigned_manager) {
        const managerDoc = await UserModel.findByNumericId(assigned_manager);
        if (!managerDoc) {
          return handleValidationError('Manager not found');
        }
        updateData.assigned_manager_id = assigned_manager;
      }
    }

    const updatedClient = await ClientModel.update(numericId, updateData);
    
    if (!updatedClient) {
      return NextResponse.json(
        { error: 'Failed to update client' },
        { status: 500 }
      );
    }

    let manager_name = null;
    let manager_email = null;
    if (updatedClient.assigned_manager_id) {
      const manager = await UserModel.findByNumericId(updatedClient.assigned_manager_id);
      if (manager) {
        manager_name = `${manager.first_name} ${manager.last_name}`.trim() || manager.username;
        manager_email = manager.email;
      }
    }

    const clientResponse = {
      id: updatedClient.numeric_id,
      name: updatedClient.name,
      company_name: updatedClient.company_name,
      contact_person: updatedClient.contact_person,
      email: updatedClient.email,
      phone: updatedClient.phone,
      website: updatedClient.website,
      industry: updatedClient.industry,
      description: updatedClient.description,
      address: updatedClient.address,
      instagram_username: updatedClient.instagram_username,
      instagram_url: updatedClient.instagram_url,
      notes: updatedClient.notes,
      status: updatedClient.status,
      status_name: updatedClient.status.charAt(0).toUpperCase() + updatedClient.status.slice(1).replace('_', ' '),
      assigned_manager_id: updatedClient.assigned_manager_id,
      manager_name,
      manager_email,
      manager_id: updatedClient.assigned_manager_id,
      assigned_team: updatedClient.assigned_team_ids,
      start_date: updatedClient.start_date?.toISOString(),
      end_date: updatedClient.end_date?.toISOString(),
      monthly_video_target: updatedClient.monthly_video_target,
      created_by_id: updatedClient.created_by_id,
      created_at: updatedClient.created_at.toISOString(),
      updated_at: updatedClient.updated_at.toISOString(),
    };

    return NextResponse.json(clientResponse);
  } catch (error) {
    return handleError(error, 'Update client');
  }
}

async function deleteHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const clientDoc = await ClientModel.findByNumericId(numericId);
    
    if (!clientDoc) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    await ClientModel.delete(numericId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Delete client');
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
