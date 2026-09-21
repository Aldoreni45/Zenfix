import { getDb, getNextNumericId } from '../client';

export interface DepartmentDocument {
  _id?: any;
  numeric_id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class DepartmentModel {
  private static getCollection() {
    return getDb().then(db => db.collection<DepartmentDocument>('zf_departments'));
  }

  static async create(data: Omit<DepartmentDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<DepartmentDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('departments.department');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for department');
    }
    
    const now = new Date();
    const document: DepartmentDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<DepartmentDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findByName(name: string): Promise<DepartmentDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  }

  static async findBySlug(slug: string): Promise<DepartmentDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ slug });
  }

  static async findById(id: any): Promise<DepartmentDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findAll(filters: Partial<DepartmentDocument> = {}): Promise<DepartmentDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ name: 1 }).toArray();
  }

  static async update(numeric_id: number, data: Partial<DepartmentDocument>): Promise<DepartmentDocument | null> {
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
