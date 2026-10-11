import { getDb, getNextNumericId } from '../client';

export interface IncomeDocument {
  _id?: any;
  numeric_id: number;
  client_id: number;
  client_name?: string;
  amount: number;
  description: string;
  category: string;
  income_date: Date;
  received_date?: Date;
  status: 'pending' | 'received';
  payment_method?: string;
  invoice_number?: string;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: Date;
  updated_at: Date;
}

export class IncomeModel {
  private static async getCollection() {
    const db = await getDb();
    if (!db) throw new Error('Database not initialized');
    return db.collection('zf_income');
  }

  static async create(data: Omit<IncomeDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<IncomeDocument> {
    const collection = await this.getCollection();
    const numeric_id = await getNextNumericId('income');
    const now = new Date();
    
    const doc = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    await collection.insertOne(doc);
    return doc as IncomeDocument;
  }

  static async findByNumericId(numeric_id: number): Promise<IncomeDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id }) as IncomeDocument | null;
  }

  static async findByClient(client_id: number): Promise<IncomeDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ client_id }).sort({ income_date: -1 }).toArray() as IncomeDocument[];
  }

  static async findAll(filters: Partial<IncomeDocument> = {}): Promise<IncomeDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ income_date: -1 }).toArray() as IncomeDocument[];
  }

  static async update(numeric_id: number, data: Partial<IncomeDocument>): Promise<IncomeDocument | null> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const result = await collection.findOneAndUpdate(
      { numeric_id },
      { 
        $set: { 
          ...data, 
          updated_at: now 
        } 
      },
      { returnDocument: 'after' }
    );
    
    return result as IncomeDocument | null;
  }

  static async delete(numeric_id: number): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ numeric_id });
    return result.deletedCount > 0;
  }

  static async getTotalIncome(filters: Partial<IncomeDocument> = {}): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.aggregate([
      { $match: filters },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    return result[0]?.total || 0;
  }

  static async getIncomeByClient(filters: Partial<IncomeDocument> = {}): Promise<any[]> {
    const collection = await this.getCollection();
    return await collection.aggregate([
      { $match: filters },
      { $group: { _id: '$client_id', client_name: { $first: '$client_name' }, total: { $sum: '$amount' } } }
    ]).toArray();
  }

  static async getIncomeByStatus(filters: Partial<IncomeDocument> = {}): Promise<any[]> {
    const collection = await this.getCollection();
    return await collection.aggregate([
      { $match: filters },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]).toArray();
  }
}
