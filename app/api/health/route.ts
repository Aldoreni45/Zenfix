import { NextResponse } from 'next/server';
import { isMongoConnected } from '@/lib/mongodb';

export async function GET() {
  try {
    const isConnected = await isMongoConnected();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'healthy',
          database: 'connected'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database is currently unavailable'
        }
      }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database connection check failed'
      }
    }, { status: 503 });
  }
}
