import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwnerOrManager } from '@/lib/auth/middleware';
import { ClientModel } from '@/lib/mongodb/models/client';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { loadProtocolContent, ensureProtocolRecords } from '@/lib/api-helpers/video-protocol';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const client_id = searchParams.get('client_id');
    const month = Number(searchParams.get('month'));
    const year = Number(searchParams.get('year'));
    const status = searchParams.get('status');

    const filters: any = {};
    if (client_id) filters.client_id = Number(client_id);
    if (month) filters.month = month;
    if (year) filters.year = year;
    if (status) filters.status = status;
    console.info('[API][video-protocol/protocols] list:start', {
      userId: user.userId,
      role: user.role,
      client_id,
      month,
      year,
      status,
    });

    console.info('[VIDEO PROTOCOL API] GET', {
      month,
      year,
      pathname: new URL(request.url).pathname,
    });

    const protocols = await VideoProtocolModel.findAll(filters);

    console.info('[VIDEO PROTOCOL API] RESULT', {
      month,
      year,
      count: protocols.length,
    });

    // Enrich with client names, backfill records/stages and calculate totals
    const protocolsWithDetails = await Promise.all(
      protocols.map(async (protocol) => {
        const client = protocol.client_id ? await ClientModel.findByNumericId(protocol.client_id) : null;
        const { protocol: fresh, summaries } = await loadProtocolContent(protocol);

        return {
          id: fresh.numeric_id,
          numeric_id: fresh.numeric_id,
          client: fresh.client_id,
          client_name: client?.name || fresh.client_name || '',
          month: fresh.month,
          year: fresh.year,
          target_videos: fresh.target_videos,
          status: fresh.status,
          workflow_progress: fresh.workflow_progress,
          fully_completed_videos: fresh.fully_completed_videos,
          video_status_counts: fresh.video_status_counts,
          total_videos: summaries.length,
          created_at: fresh.created_at.toISOString(),
          updated_at: fresh.updated_at.toISOString(),
        };
      })
    );

    console.info('[API][video-protocol/protocols] list:success', {
      userId: user.userId,
      role: user.role,
      count: protocolsWithDetails.length,
    });
    return NextResponse.json(protocolsWithDetails);
  } catch (error) {
    console.error('List protocols error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createHandler(request: NextRequest, user: any) {
  try {
    const body = await request.json();
    const { client, month, year, target_videos } = body;
    console.info('[API][video-protocol/protocols] create:start', {
      userId: user.userId,
      role: user.role,
      client,
      month,
      year,
      target_videos,
    });

    if (!client || !month || !year || !target_videos) {
      return NextResponse.json(
        { error: 'client, month, year, and target_videos are required' },
        { status: 400 }
      );
    }

    // Validate client
    const clientDoc = await ClientModel.findByNumericId(client);
    if (!clientDoc) {
      return NextResponse.json(
        { error: 'Client not found.' },
        { status: 400 }
      );
    }

    // Check if protocol already exists for this client/month/year
    const existing = await VideoProtocolModel.findByClient(client, parseInt(month), parseInt(year));
    if (existing) {
      return NextResponse.json(
        { error: 'Video protocol already exists for this client, month, and year.' },
        { status: 400 }
      );
    }

    // Create the protocol
    const protocol = await VideoProtocolModel.create({
      client_id: client,
      client_name: clientDoc.name,
      month: parseInt(month),
      year: parseInt(year),
      target_videos: parseInt(target_videos),
      status: 'active',
      workflow_progress: 0,
      completed_stages: 0,
      total_stages: 0,
      fully_completed_videos: 0,
      stage_counts: {},
      video_status_counts: { not_started: 0, in_progress: 0, posted: 0 },
    });

    // Django parity: materialize target_videos VideoRecords with 5 stages each
    await ensureProtocolRecords(protocol);
    // Recompute aggregate counters (workflow_progress, stage counts, etc.)
    await loadProtocolContent(protocol);
    const refreshed = (await VideoProtocolModel.findByNumericId(protocol.numeric_id)) || protocol;

    const response = {
      id: refreshed.numeric_id,
      numeric_id: refreshed.numeric_id,
      client: refreshed.client_id,
      client_name: clientDoc.name,
      month: refreshed.month,
      year: refreshed.year,
      target_videos: refreshed.target_videos,
      status: refreshed.status,
      workflow_progress: refreshed.workflow_progress,
      completed_stages: refreshed.completed_stages,
      total_stages: refreshed.total_stages,
      fully_completed_videos: refreshed.fully_completed_videos,
      stage_counts: refreshed.stage_counts,
      video_status_counts: refreshed.video_status_counts,
      created_at: refreshed.created_at.toISOString(),
      updated_at: refreshed.updated_at.toISOString(),
    };

    console.info('[API][video-protocol/protocols] create:success', {
      userId: user.userId,
      role: user.role,
      protocol_id: response.id,
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Create protocol error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(handler);
export const POST = requireOwnerOrManager(createHandler);