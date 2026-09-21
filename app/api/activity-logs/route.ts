import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwnerOrManager } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { UserModel } from '@/lib/mongodb/models/user';
import { formatUserName, formatActionName, formatEntityName } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entity_type = searchParams.get('entity_type');
    const limit = parseInt(searchParams.get('limit') || '100');

    const filters: any = {};
    
    // Role-based filtering
    if (user.role === 'owner' || user.role === 'manager') {
      // See all
    } else {
      filters.actor_id = user.userId;
    }

    if (action) filters.action = action;
    if (entity_type) filters.entity_type = entity_type;

    const logs = await ActivityLogModel.findAll(filters, limit || 100);

    const logsWithDetails = await Promise.all(
      logs.map(async (l) => {
        let actor = null;
        if (l.actor_id) {
          actor = await UserModel.findByNumericId(l.actor_id);
        }
        
        return {
          id: l.numeric_id,
          user: l.actor_id,
          user_email: actor?.email || '',
          user_name: actor ? `${actor.first_name} ${actor.last_name}`.trim() || actor.username : '',
          action: l.action,
          action_name: l.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          entity: l.entity_type,
          entity_name: l.entity_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          entity_id: l.entity_id,
          details: l.metadata,
          description: l.description,
          ip_address: l.ip_address,
          user_agent: l.user_agent,
          timestamp: l.created_at.toISOString(),
          created_at: l.created_at.toISOString(),
        };
      })
    );

    return NextResponse.json(logsWithDetails);
  } catch (error) {
    return handleError(error, 'List activity logs');
  }
}

export const GET = requireAuth(handler);
