import { getDb, getNextNumericId } from '../client';

export interface EmployeePaymentDocument {
  _id?: any;
  numeric_id: number;
  employee_id: number;
  employee_name?: string;
  employee_email?: string;
  total_spending: number;
  amount_paid: number;
  amount_pending: number;
  status: 'pending' | 'partial' | 'completed';
  payment_date?: Date;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: Date;
  updated_at: Date;
}

export class EmployeePaymentModel {
  private static async getCollection() {
    const db = await getDb();
    if (!db) throw new Error('Database not initialized');
    return db.collection('zf_employee_payments');
  }

  static async create(data: Omit<EmployeePaymentDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<EmployeePaymentDocument> {
    const collection = await this.getCollection();
    const numeric_id = await getNextNumericId('employee-payments');
    const now = new Date();
    
    const doc = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    await collection.insertOne(doc);
    return doc as EmployeePaymentDocument;
  }

  static async findByNumericId(numeric_id: number): Promise<EmployeePaymentDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id }) as EmployeePaymentDocument | null;
  }

  static async findByEmployee(employee_id: number): Promise<EmployeePaymentDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ employee_id }).sort({ created_at: -1 }).toArray() as EmployeePaymentDocument[];
  }

  static async findAll(filters: Partial<EmployeePaymentDocument> = {}): Promise<EmployeePaymentDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ created_at: -1 }).toArray() as EmployeePaymentDocument[];
  }

  static async update(numeric_id: number, data: Partial<EmployeePaymentDocument>): Promise<EmployeePaymentDocument | null> {
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
    
    return result as EmployeePaymentDocument | null;
  }

  static async delete(numeric_id: number): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ numeric_id });
    return result.deletedCount > 0;
  }

  static async getTotalPendingPayments(): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.aggregate([
      { $match: { status: { $in: ['pending', 'partial'] } } },
      { $group: { _id: null, total: { $sum: '$amount_pending' } } }
    ]).toArray();
    return result[0]?.total || 0;
  }

  static async getPaymentsByStatus(): Promise<any[]> {
    const collection = await this.getCollection();
    return await collection.aggregate([
      { $group: { _id: '$status', total: { $sum: '$amount_pending' }, count: { $sum: 1 } } }
    ]).toArray();
  }
}
