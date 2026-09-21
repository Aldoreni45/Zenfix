import { NextRequest, NextResponse } from 'next/server';
import { VideoAssetModel } from '@/lib/mongodb/models/video';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const assetId = parseInt(id);
      const asset = await VideoAssetModel.findAssetByNumericId(assetId);

      if (!asset) {
        return NextResponse.json(
          { error: 'Video asset not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(asset);
    } catch (error) {
      console.error('Error fetching video asset:', error);
      return NextResponse.json(
        { error: 'Failed to fetch video asset' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const assetId = parseInt(id);
      const body = await request.json();

      const updated = await VideoAssetModel.updateAsset(assetId, body);
      if (!updated) {
        return NextResponse.json(
          { error: 'Video asset not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating video asset:', error);
      return NextResponse.json(
        { error: 'Failed to update video asset' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const assetId = parseInt(id);

      const deleted = await VideoAssetModel.deleteAsset(assetId);
      if (!deleted) {
        return NextResponse.json(
          { error: 'Video asset not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting video asset:', error);
      return NextResponse.json(
        { error: 'Failed to delete video asset' },
        { status: 500 }
      );
    }
  })(request);
}
