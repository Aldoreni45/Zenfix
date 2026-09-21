import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { getClientIp, getUserAgent } from './response-formatter';

/**
 * Create an activity log entry
 */
export async function logActivity(params: {
  actorId: number;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: any;
  request?: Request;
}): Promise<void> {
  const { actorId, action, entityType, entityId, description, metadata = {}, request } = params;
  
  await ActivityLogModel.create({
    actor_id: actorId,
    action: action as any,
    entity_type: entityType,
    entity_id: entityId,
    description,
    metadata,
    ip_address: request ? getClientIp(request) : 'unknown',
    user_agent: request ? getUserAgent(request) : '',
  });
}
