import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { UserModel } from '@/lib/mongodb/models/user';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get logs for the current user
    const logs = await ActivityLogModel.findAll({ actor_id: user.userId }, limit);

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
          timestamp: l.created_at,
        };
      })
    );

    return NextResponse.json(logsWithDetails);
  } catch (error) {
    console.error('My logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(handler);
