import { getDb, getNextNumericId } from '../client';
import { TargetType } from '../../types/models';

export interface MonthlyTargetDocument {
  _id?: any;
  numeric_id: number;
  user_id?: number;
  department_id?: number;
  client_id?: number;
  month: number;
  year: number;
  target_type: TargetType;
  target_value: number;
  achieved_value: number;
  target_videos: number;
  completed_videos: number;
  posted_videos: number;
  pending_videos: number;
  in_production_videos: number;
  waiting_approval_videos: number;
  notes?: string;
  start_date?: Date;
  end_date?: Date;
  created_by_id?: number;
  created_at: Date;
  updated_at: Date;
}

export class MonthlyTargetModel {
  private static getCollection() {
    return getDb().then(db => db.collection<MonthlyTargetDocument>('zf_monthly_targets'));
  }

  static async create(data: Omit<MonthlyTargetDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<MonthlyTargetDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('targets.monthlytarget');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for monthly target');
    }
    
    const now = new Date();
    const document: MonthlyTargetDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<MonthlyTargetDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findById(id: any): Promise<MonthlyTargetDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findAll(filters: Partial<MonthlyTargetDocument> = {}): Promise<MonthlyTargetDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ year: -1, month: -1 }).toArray();
  }

  static async findByUserAndMonth(user_id: number, month: number, year: number, target_type?: TargetType): Promise<MonthlyTargetDocument[]> {
    const collection = await this.getCollection();
    const filter: any = { user_id, month, year };
    if (target_type) {
      filter.target_type = target_type;
    }
    return await collection.find(filter).toArray();
  }

  static async update(numeric_id: number, data: Partial<MonthlyTargetDocument>): Promise<MonthlyTargetDocument | null> {
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
