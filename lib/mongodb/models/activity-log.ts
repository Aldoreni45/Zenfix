import { getDb, getNextNumericId } from '../client';
import { ActivityAction } from '../../types/models';

export interface ActivityLogDocument {
  _id?: any;
  numeric_id: number;
  actor_id?: number;
  action: ActivityAction;
  entity_type: string;
  entity_id: string;
  description?: string;
  metadata: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
}

export class ActivityLogModel {
  private static getCollection() {
    return getDb().then(db => db.collection<ActivityLogDocument>('zf_activity_logs'));
  }

  static async create(data: Omit<ActivityLogDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<ActivityLogDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('activity_logs.activitylog');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for activity log');
    }
    
    const now = new Date();
    const document: ActivityLogDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<ActivityLogDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findByActor(actor_id: number): Promise<ActivityLogDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ actor_id }).sort({ created_at: -1 }).toArray();
  }

  static async findByEntity(entity_type: string, entity_id: string): Promise<ActivityLogDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ entity_type, entity_id }).sort({ created_at: -1 }).toArray();
  }

  static async findById(id: any): Promise<ActivityLogDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findAll(filters: Partial<ActivityLogDocument> = {}, limit: number = 100, skip: number = 0): Promise<ActivityLogDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();
  }

  static async count(filters: Partial<ActivityLogDocument> = {}): Promise<number> {
    const collection = await this.getCollection();
    return await collection.countDocuments(filters);
  }

  static async findRecent(limit: number = 10): Promise<ActivityLogDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({}).sort({ created_at: -1 }).limit(limit).toArray();
  }

  static async delete(numeric_id: number): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ numeric_id });
    return result.deletedCount > 0;
  }
}
