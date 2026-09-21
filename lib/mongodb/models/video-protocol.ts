import { getDb, getNextNumericId } from '../client';

export interface VideoStageDocument {
  _id?: any;
  numeric_id: number;
  video_record_id: number;
  stage_type: 'shoot' | 'edit' | 'review' | 'client_approval' | 'instagram_post';
  stage_display: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'rejected';
  status_display: string;
  assigned_to_id?: number;
  assigned_to_detail?: {
    id: number;
    numeric_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  started_at?: Date;
  completed_at?: Date;
  due_date?: Date;
  notes: string;
  rejection_reason: string;
  drive_link: string;
  completion_notes: string;
  instagram_url: string;
  caption: string;
  submitted_by_name?: string;
  is_locked: boolean;
  is_overdue: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface VideoRecordDocument {
  _id?: any;
  numeric_id: number;
  protocol_id: number;
  video_number: number;
  title: string;
  client_id: number;
  client_name?: string;
  month: number;
  year: number;
  target_videos: number;
  status: string;
  current_status: string;
  current_stage_name: string;
  completion_percentage: number;
  created_at: Date;
  updated_at: Date;
}

export interface VideoProtocolDocument {
  _id?: any;
  numeric_id: number;
  client_id: number;
  client_name?: string;
  month: number;
  year: number;
  target_videos: number;
  status: string;
  workflow_progress: number;
  completed_stages: number;
  total_stages: number;
  fully_completed_videos: number;
  stage_counts: Record<string, { completed: number; total: number }>;
  video_status_counts: { not_started: number; in_progress: number; posted: number };
  created_at: Date;
  updated_at: Date;
}

export class VideoStageModel {
  private static getCollection() {
    return getDb().then(db => db.collection<VideoStageDocument>('zf_video_stages'));
  }

  static async create(data: Omit<VideoStageDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<VideoStageDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('video-protocol.stages');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for video stage');
    }
    
    const now = new Date();
    const document: VideoStageDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<VideoStageDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findByVideoRecord(video_record_id: number): Promise<VideoStageDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ video_record_id }).sort({ created_at: 1 }).toArray();
  }

  static async findAll(filters: Partial<VideoStageDocument> = {}): Promise<VideoStageDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ created_at: -1 }).toArray();
  }

  static async update(numeric_id: number, data: Partial<VideoStageDocument>): Promise<VideoStageDocument | null> {
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

export class VideoRecordModel {
  private static getCollection() {
    return getDb().then(db => db.collection<VideoRecordDocument>('zf_video_records'));
  }

  static async create(data: Omit<VideoRecordDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<VideoRecordDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('video-protocol.records');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for video record');
    }
    
    const now = new Date();
    const document: VideoRecordDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<VideoRecordDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findByProtocol(protocol_id: number): Promise<VideoRecordDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ protocol_id }).sort({ video_number: 1 }).toArray();
  }

  static async findAll(filters: Partial<VideoRecordDocument> = {}): Promise<VideoRecordDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ created_at: -1 }).toArray();
  }

  static async update(numeric_id: number, data: Partial<VideoRecordDocument>): Promise<VideoRecordDocument | null> {
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

export class VideoProtocolModel {
  private static getCollection() {
    return getDb().then(db => db.collection<VideoProtocolDocument>('zf_video_protocols'));
  }

  static async create(data: Omit<VideoProtocolDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<VideoProtocolDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('video-protocol.protocols');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for video protocol');
    }
    
    const now = new Date();
    const document: VideoProtocolDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<VideoProtocolDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findByClient(client_id: number, month: number, year: number): Promise<VideoProtocolDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ client_id, month, year });
  }

  static async findAll(filters: Partial<VideoProtocolDocument> = {}): Promise<VideoProtocolDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ created_at: -1 }).toArray();
  }

  static async update(numeric_id: number, data: Partial<VideoProtocolDocument>): Promise<VideoProtocolDocument | null> {
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
