import { getDb, getNextNumericId } from '../client';
import { ApprovalStatus } from '../../types/models';

export interface ApprovalDocument {
  _id?: any;
  numeric_id: number;
  content_type: string;
  object_id: string;
  video_id?: number;
  task_id?: number;
  approval_type: string;
  requested_by_id?: number;
  reviewed_by_id?: number;
  reviewer_id?: number;
  status: ApprovalStatus;
  comments?: string;
  reviewer_comments?: string;
  requested_at: Date;
  reviewed_at?: Date;
  client_contact?: string;
  client_email?: string;
  change_requests: any[];
  created_at: Date;
  updated_at: Date;
}

export class ApprovalModel {
  private static getCollection() {
    return getDb().then(db => db.collection<ApprovalDocument>('zf_approvals'));
  }

  static async create(data: Omit<ApprovalDocument, '_id' | 'numeric_id' | 'requested_at' | 'created_at' | 'updated_at'>): Promise<ApprovalDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('approvals.approval');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for approval');
    }
    
    const now = new Date();
    const document: ApprovalDocument = {
      ...data,
      numeric_id,
      requested_at: now,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<ApprovalDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findById(id: any): Promise<ApprovalDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findAll(filters: Partial<ApprovalDocument> = {}): Promise<ApprovalDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ created_at: -1 }).toArray();
  }

  static async update(numeric_id: number, data: Partial<ApprovalDocument>): Promise<ApprovalDocument | null> {
    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { numeric_id },
      { 
        $set: { 
          ...data, 
          updated_at: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    return result;
  }

  static async delete(numeric_id: number): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ numeric_id });
    return result.deletedCount > 0;
  }
}
