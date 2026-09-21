import { NextRequest, NextResponse } from 'next/server';
import { ClientModel } from '@/lib/mongodb/models/client';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const clients = await ClientModel.findAll({ status: 'active' });
      
      // Enrich with manager names
      const enrichedClients = await Promise.all(
        clients.map(async (client) => {
          let manager_name = null;
          if (client.assigned_manager_id) {
            const UserModel = (await import('@/lib/mongodb/models/user')).UserModel;
            const manager = await UserModel.findByNumericId(client.assigned_manager_id);
            if (manager) {
              manager_name = `${manager.first_name} ${manager.last_name}`;
            }
          }
          return {
            ...client,
            manager_name,
          };
        })
      );

      return NextResponse.json(enrichedClients);
    } catch (error) {
      console.error('Error fetching active clients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch active clients' },
        { status: 500 }
      );
    }
  })(request);
}
