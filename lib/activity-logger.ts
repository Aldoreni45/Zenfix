import ActivityLog from '@/models/ActivityLog';
import connectDB from '@/lib/mongodb';

export async function logActivity(data: {
  user: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await connectDB();
    await ActivityLog.create(data);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
