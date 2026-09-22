import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { UserModel } from '@/lib/mongodb/models/user';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entity_type = searchParams.get('entity_type');
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));

    const filters: any = {};

    // Role-based filtering
    if (user.role === 'owner' || user.role === 'manager') {
      // See all
    } else {
      filters.actor_id = user.userId;
    }

    if (action) filters.action = action;
    if (entity_type) filters.entity_type = entity_type;

    // Search by entity id or actor name/email/username
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(escaped, 'i');
      let actorIds: number[] = [];
      try {
        const actorMatches = await UserModel.findAll({
          $or: [
            { username: rx },
            { email: rx },
            { first_name: rx },
            { last_name: rx },
          ],
        } as any);
        actorIds = actorMatches.map((u) => u.numeric_id as number);
      } catch {
        actorIds = [];
      }
      const or: any[] = [{ entity_id: rx }];
      if (actorIds.length) or.push({ actor_id: { $in: actorIds } });
      filters.$or = or;
    }

    const total = await ActivityLogModel.count(filters);
    const logs = await ActivityLogModel.findAll(filters, pageSize, (page - 1) * pageSize);

    const items = await Promise.all(
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

    return NextResponse.json({ items, count: total, page, page_size: pageSize });
  } catch (error) {
    return handleError(error, 'List activity logs');
  }
}

export const GET = requireAuth(handler);