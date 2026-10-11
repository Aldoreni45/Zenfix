import { getDb, getNextNumericId } from '../client';

export interface SpendingDocument {
  _id?: any;
  numeric_id: number;
  client_id: number;
  client_name?: string;
  employee_id: number;
  employee_name?: string;
  employee_email?: string;
  amount: number;
  description: string;
  category: string;
  location?: string;
  date: Date;
  created_by: number;
  created_by_name?: string;
  notes?: string;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class SpendingModel {
  private static getCollection() {
    return getDb().then(db => db.collection<SpendingDocument>('zf_spendings'));
  }

  static async create(data: Omit<SpendingDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<SpendingDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('spendings.spending');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for spending');
    }
    
    const now = new Date();
    const document: SpendingDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<SpendingDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findByClient(client_id: number): Promise<SpendingDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ client_id }).sort({ date: -1 }).toArray();
  }

  static async findByEmployee(employee_id: number): Promise<SpendingDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ employee_id }).sort({ date: -1 }).toArray();
  }

  static async findAll(filters: Partial<SpendingDocument> = {}): Promise<SpendingDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ date: -1 }).toArray();
  }

  static async update(numeric_id: number, data: Partial<SpendingDocument>): Promise<SpendingDocument | null> {
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

  static async updateMany(filters: Partial<SpendingDocument>, data: Partial<SpendingDocument>): Promise<{ modifiedCount: number }> {
    const collection = await this.getCollection();
    const result = await collection.updateMany(
      filters,
      {
        $set: {
          ...data,
          updated_at: new Date()
        }
      }
    );
    return { modifiedCount: result.modifiedCount };
  }

  static async delete(numeric_id: number): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ numeric_id });
    return result.deletedCount > 0;
  }

  static async getTotalSpending(filters: Partial<SpendingDocument> = {}): Promise<number> {
    const collection = await this.getCollection();
    const pipeline = [
      { $match: filters },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ];
    const result = await collection.aggregate(pipeline).toArray();
    return result[0]?.total || 0;
  }

  static async getSpendingByClient(filters: Partial<SpendingDocument> = {}): Promise<any[]> {
    const collection = await this.getCollection();
    const pipeline = [
      { $match: filters },
      { 
        $group: { 
          _id: { client_id: '$client_id', client_name: '$client_name' }, 
          total: { $sum: '$amount' } 
        } 
      },
      { 
        $project: { 
          client_id: '$_id.client_id', 
          client_name: '$_id.client_name', 
          total: 1,
          _id: 0 
        } 
      }
    ];
    return await collection.aggregate(pipeline).toArray();
  }

  static async getSpendingByEmployee(filters: Partial<SpendingDocument> = {}): Promise<any[]> {
    const collection = await this.getCollection();
    const pipeline = [
      { $match: filters },
      { 
        $group: { 
          _id: { employee_id: '$employee_id', employee_name: '$employee_name' }, 
          total: { $sum: '$amount' } 
        } 
      },
      { 
        $project: { 
          employee_id: '$_id.employee_id', 
          employee_name: '$_id.employee_name', 
          total: 1,
          _id: 0 
        } 
      }
    ];
    return await collection.aggregate(pipeline).toArray();
  }
}
