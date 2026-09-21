import { getDb, getNextNumericId } from '../client';
import { ClientStatus } from '../../types/models';

export interface ClientDocument {
  _id?: any;
  numeric_id: number;
  name: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  description?: string;
  address?: string;
  instagram_username?: string;
  instagram_url?: string;
  notes?: string;
  status: ClientStatus;
  assigned_manager_id?: number;
  assigned_team_ids: number[];
  start_date?: Date;
  end_date?: Date;
  monthly_video_target: number;
  created_by_id?: number;
  created_at: Date;
  updated_at: Date;
}

export class ClientModel {
  private static getCollection() {
    return getDb().then(db => db.collection<ClientDocument>('zf_clients'));
  }

  static async create(data: Omit<ClientDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<ClientDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('clients.client');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for client');
    }
    
    const now = new Date();
    const document: ClientDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<ClientDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findById(id: any): Promise<ClientDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findAll(filters: Partial<ClientDocument> = {}): Promise<ClientDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ created_at: -1 }).toArray();
  }

  static async update(numeric_id: number, data: Partial<ClientDocument>): Promise<ClientDocument | null> {
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
