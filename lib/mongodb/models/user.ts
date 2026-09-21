import { getDb, getNextNumericId } from '../client';
import { hashPassword } from '../../auth/password';
import { UserRole, UserStatus } from '../../types/models';

export interface UserDocument {
  _id?: any;
  numeric_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  department_id?: number;
  reports_to_id?: number;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  private static getCollection() {
    return getDb().then(db => db.collection<UserDocument>('zf_users'));
  }

  static async create(data: Omit<UserDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at' | 'is_active' | 'is_staff' | 'is_superuser'>): Promise<UserDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('users.user');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for user');
    }
    
    const is_active = data.status === UserStatus.ACTIVE;
    const is_staff = data.role === UserRole.OWNER;
    const is_superuser = data.role === UserRole.OWNER;
    
    const now = new Date();
    const document: UserDocument = {
      ...data,
      numeric_id,
      is_active,
      is_staff,
      is_superuser,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<UserDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findByUsername(username: string): Promise<UserDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ username });
  }

  static async findByEmail(email: string): Promise<UserDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ email });
  }

  static async findById(id: any): Promise<UserDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findAll(filters: Partial<UserDocument> = {}): Promise<UserDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).toArray();
  }

  static async update(numeric_id: number, data: Partial<UserDocument>): Promise<UserDocument | null> {
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

  static async setPassword(numeric_id: number, password: string): Promise<void> {
    const hashedPassword = await hashPassword(password);
    await this.update(numeric_id, { password: hashedPassword });
  }
}
