import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { ClientModel } from '@/lib/mongodb/models/client';
import { UserModel } from '@/lib/mongodb/models/user';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { formatUserName } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { ActivityAction } from '@/lib/types/models';
import { ClientStatus } from '@/lib/types/models';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filters: any = {};
    
    // Django: Role-based filtering for clients
    if (user.role === 'owner' || user.role === 'manager') {
      // Owner and Manager see all clients
    } else {
      // Employee sees only clients where they are in assigned_team OR have tasks assigned to them
      const userDoc = await UserModel.findByNumericId(user.userId);
      if (userDoc) {
        const clientsWithTeam = await ClientModel.findAll({
          assigned_team_ids: { $in: [user.userId] }
        } as any);
        
        // Get clients where user has tasks assigned
        const TaskModel = (await import('@/lib/mongodb/models/task')).TaskModel;
        const userTasks = await TaskModel.findAll({ assigned_to_id: user.userId });
        const clientIdsFromTasks = userTasks.map(t => t.client_id).filter(Boolean);
        
        const clientsFromTasks = clientIdsFromTasks.length > 0 
          ? await ClientModel.findAll({ numeric_id: { $in: clientIdsFromTasks } } as any)
          : [];
        
        // Combine and deduplicate
        const allClientIds = new Set([
          ...clientsWithTeam.map(c => c.numeric_id),
          ...clientsFromTasks.map(c => c.numeric_id)
        ]);
        
        if (allClientIds.size > 0) {
          filters.numeric_id = { $in: Array.from(allClientIds) } as any;
        } else {
          // Employee has no client access
          return NextResponse.json([]);
        }
      }
    }

    if (status) filters.status = status;
    
    let clients;
    if (search) {
      clients = await ClientModel.findAll({
        ...filters,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { company_name: { $regex: search, $options: 'i' } },
          { contact_person: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      });
    } else {
      clients = await ClientModel.findAll(filters);
    }

    const clientsWithDetails = await Promise.all(
      clients.map(async (c) => {
        let manager_name = null;
        let manager_email = null;
        if (c.assigned_manager_id) {
          const manager = await UserModel.findByNumericId(c.assigned_manager_id);
          if (manager) {
            manager_name = formatUserName(manager);
            manager_email = manager.email;
          }
        }

        return {
          id: c.numeric_id,
          name: c.name,
          company_name: c.company_name,
          contact_person: c.contact_person,
          email: c.email,
          phone: c.phone,
          website: c.website,
          industry: c.industry,
          description: c.description,
          address: c.address,
          instagram_username: c.instagram_username,
          instagram_url: c.instagram_url,
          notes: c.notes,
          status: c.status,
          status_name: c.status.charAt(0).toUpperCase() + c.status.slice(1).replace('_', ' '),
          assigned_manager_id: c.assigned_manager_id,
          manager_name,
          manager_email,
          manager_id: c.assigned_manager_id,
          assigned_team: c.assigned_team_ids,
          start_date: c.start_date?.toISOString(),
          end_date: c.end_date?.toISOString(),
          monthly_video_target: c.monthly_video_target,
          created_by_id: c.created_by_id,
          created_at: c.created_at.toISOString(),
          updated_at: c.updated_at.toISOString(),
        };
      })
    );

    return NextResponse.json(clientsWithDetails);
  } catch (error) {
    return handleError(error, 'List clients');
  }
}

async function createHandler(request: NextRequest, user: any) {
  try {
    // Django: Employees cannot create clients
    if (user.role === 'employee') {
      return NextResponse.json(
        { error: 'Employees cannot create clients.' },
        { status: 403 }
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
      status = ClientStatus.LEAD,
      assigned_manager,
      assigned_team,
      start_date,
      end_date,
      monthly_video_target = 5,
    } = body;

    if (!name) {
      return handleValidationError('Name is required');
    }

    // Validate assigned_manager
    let assigned_manager_id = null;
    if (assigned_manager) {
      const managerDoc = await UserModel.findByNumericId(assigned_manager);
      if (!managerDoc) {
        return handleValidationError('Manager not found');
      }
      assigned_manager_id = assigned_manager;
    }

    const newClient = await ClientModel.create({
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
      assigned_manager_id,
      assigned_team_ids: assigned_team || [],
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      monthly_video_target,
      created_by_id: user.userId,
    });

    // Log activity
    await logActivity({
      actorId: user.userId,
      action: 'CREATE',
      entityType: 'client',
      entityId: newClient.numeric_id.toString(),
      description: `Created client ${newClient.name}`,
      request,
    });

    // Django: Notify assigned manager
    if (assigned_manager_id) {
      const NotificationModel = (await import('@/lib/mongodb/models/notification')).NotificationModel;
      await NotificationModel.create({
        recipient_id: assigned_manager_id,
        notification_type: 'client_assigned',
        title: 'Client assigned',
        message: `You were assigned ${newClient.name}.`,
        is_read: false,
        related_object_type: 'client',
        related_object_id: newClient.numeric_id.toString(),
        priority: 'medium',
      });
    }

    let manager_name = null;
    let manager_email = null;
    if (newClient.assigned_manager_id) {
      const manager = await UserModel.findByNumericId(newClient.assigned_manager_id);
      if (manager) {
        manager_name = formatUserName(manager);
        manager_email = manager.email;
      }
    }

    const clientResponse = {
      id: newClient.numeric_id,
      name: newClient.name,
      company_name: newClient.company_name,
      contact_person: newClient.contact_person,
      email: newClient.email,
      phone: newClient.phone,
      website: newClient.website,
      industry: newClient.industry,
      description: newClient.description,
      address: newClient.address,
      instagram_username: newClient.instagram_username,
      instagram_url: newClient.instagram_url,
      notes: newClient.notes,
      status: newClient.status,
      status_name: newClient.status.charAt(0).toUpperCase() + newClient.status.slice(1).replace('_', ' '),
      assigned_manager_id: newClient.assigned_manager_id,
      manager_name,
      manager_email,
      manager_id: newClient.assigned_manager_id,
      assigned_team: newClient.assigned_team_ids,
      start_date: newClient.start_date?.toISOString(),
      end_date: newClient.end_date?.toISOString(),
      monthly_video_target: newClient.monthly_video_target,
      created_by_id: newClient.created_by_id,
      created_at: newClient.created_at.toISOString(),
      updated_at: newClient.updated_at.toISOString(),
    };

    return NextResponse.json(clientResponse, { status: 201 });
  } catch (error) {
    return handleError(error, 'Create client');
  }
}

export const GET = requireAuth(handler);
export const POST = requireAuth(createHandler);
