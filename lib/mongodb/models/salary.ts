import { getDb, getNextNumericId } from '../client';

export interface SalaryDocument {
  _id?: any;
  numeric_id: number;
  employee_id: number;
  employee_name?: string;
  employee_email?: string;
  amount: number;
  month: string; // Format: "2024-01" for January 2024
  status: 'pending' | 'paid';
  paid_date?: Date;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: Date;
  updated_at: Date;
}

export class SalaryModel {
  private static async getCollection() {
    const db = await getDb();
    if (!db) throw new Error('Database not initialized');
    return db.collection('zf_salaries');
  }

  static async create(data: Omit<SalaryDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<SalaryDocument> {
    const collection = await this.getCollection();
    const numeric_id = await getNextNumericId('salary');
    const now = new Date();
    
    const doc = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    await collection.insertOne(doc);
    return doc as SalaryDocument;
  }

  static async findByNumericId(numeric_id: number): Promise<SalaryDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id }) as SalaryDocument | null;
  }

  static async findByEmployee(employee_id: number): Promise<SalaryDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ employee_id }).sort({ month: -1 }).toArray() as SalaryDocument[];
  }

  static async findByMonth(month: string): Promise<SalaryDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ month }).toArray() as SalaryDocument[];
  }

  static async findAll(filters: Partial<SalaryDocument> = {}): Promise<SalaryDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ month: -1, created_at: -1 }).toArray() as SalaryDocument[];
  }

  static async update(numeric_id: number, data: Partial<SalaryDocument>): Promise<SalaryDocument | null> {
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
    
    return result as SalaryDocument | null;
  }

  static async delete(numeric_id: number): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ numeric_id });
    return result.deletedCount > 0;
  }

  static async getTotalSalaryByMonth(month: string): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.aggregate([
      { $match: { month } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    return result[0]?.total || 0;
  }

  static async getSalaryByEmployeeAndMonth(employee_id: number, month: string): Promise<SalaryDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ employee_id, month }) as SalaryDocument | null;
  }
}
