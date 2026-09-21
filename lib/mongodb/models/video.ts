import { getDb, getNextNumericId } from '../client';
import { VideoStage, VideoPriority } from '../../types/models';

export interface VideoDocument {
  _id?: any;
  numeric_id: number;
  video_code: string;
  title: string;
  description?: string;
  client_id?: number;
  assigned_to_id?: number;
  created_by_id?: number;
  stage: VideoStage;
  status: VideoStage;
  priority: VideoPriority;
  deadline?: Date;
  script?: string;
  video_url?: string;
  thumbnail_url?: string;
  feedback?: string;
  monthly_target_id?: number;
  shoot_date?: Date;
  edit_due_date?: Date;
  approval_date?: Date;
  posted_date?: Date;
  shooter_id?: number;
  editor_id?: number;
  social_media_handler_id?: number;
  raw_footage_urls: string[];
  edited_video_url?: string;
  final_video_url?: string;
  duration?: number;
  format?: string;
  rejection_reason?: string;
  rejection_count: number;
  instagram_caption?: string;
  instagram_hashtags: string[];
  instagram_post_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VideoAssetDocument {
  _id?: any;
  numeric_id: number;
  video_id: number;
  uploaded_by_id?: number;
  file_url: string;
  kind: string;
  uploaded_at: Date;
  created_at: Date;
}

export interface SocialPostDocument {
  _id?: any;
  numeric_id: number;
  video_id?: number;
  platform: string;
  post_type: string;
  status: string;
  caption?: string;
  hashtags: string[];
  mention_users: string[];
  scheduled_date?: Date;
  posted_date?: Date;
  post_url?: string;
  assigned_to_id?: number;
  created_by_id?: number;
  created_at: Date;
  updated_at: Date;
}

export class VideoModel {
  private static getCollection() {
    return getDb().then(db => db.collection<VideoDocument>('zf_videos'));
  }

  static async create(data: Omit<VideoDocument, '_id' | 'numeric_id' | 'video_code' | 'created_at' | 'updated_at'>): Promise<VideoDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('videos.video');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for video');
    }
    
    const now = new Date();
    const document: VideoDocument = {
      ...data,
      numeric_id,
      video_code: `ZF-${numeric_id.toString().padStart(4, '0')}`,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<VideoDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findByVideoCode(video_code: string): Promise<VideoDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ video_code });
  }

  static async findById(id: any): Promise<VideoDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findAll(filters: Partial<VideoDocument> = {}): Promise<VideoDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ created_at: -1 }).toArray();
  }

  static async update(numeric_id: number, data: Partial<VideoDocument>): Promise<VideoDocument | null> {
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

export class VideoAssetModel {
  private static getCollection() {
    return getDb().then(db => db.collection<VideoAssetDocument>('zf_video_assets'));
  }

  static async create(data: Omit<VideoAssetDocument, '_id' | 'numeric_id' | 'uploaded_at' | 'created_at'>): Promise<VideoAssetDocument> {
    const collection = await this.getCollection();
    const numeric_id = await getNextNumericId('videos.videoasset');
    
    const now = new Date();
    const document: VideoAssetDocument = {
      ...data,
      numeric_id,
      uploaded_at: now,
      created_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByVideo(video_id: number): Promise<VideoAssetDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ video_id }).toArray();
  }

  static async findByNumericId(numeric_id: number): Promise<VideoAssetDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findAllAssets(filters: Partial<VideoAssetDocument> = {}): Promise<VideoAssetDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).toArray();
  }

  static async updateAsset(numeric_id: number, data: Partial<VideoAssetDocument>): Promise<VideoAssetDocument | null> {
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

  static async deleteAsset(numeric_id: number): Promise<boolean> {
    return this.delete(numeric_id);
  }

  static async createAsset(data: Omit<VideoAssetDocument, '_id' | 'numeric_id' | 'uploaded_at' | 'created_at'>): Promise<VideoAssetDocument> {
    return this.create(data);
  }

  static async findAssetByNumericId(numeric_id: number): Promise<VideoAssetDocument | null> {
    return this.findByNumericId(numeric_id);
  }
}

export class SocialPostModel {
  private static getCollection() {
    return getDb().then(db => db.collection<SocialPostDocument>('zf_social_posts'));
  }

  static async create(data: Omit<SocialPostDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<SocialPostDocument> {
    const collection = await this.getCollection();
    const numeric_id = await getNextNumericId('videos.socialpost');
    
    const now = new Date();
    const document: SocialPostDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<SocialPostDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findById(id: any): Promise<SocialPostDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findAll(filters: Partial<SocialPostDocument> = {}): Promise<SocialPostDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).toArray();
  }

  static async update(numeric_id: number, data: Partial<SocialPostDocument>): Promise<SocialPostDocument | null> {
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
