import { getDb, getNextNumericId } from '../client';

export interface NotificationDocument {
  _id?: any;
  numeric_id: number;
  recipient_id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_object_type: string;
  related_object_id: string;
  link?: string;
  priority: string;
  read_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class NotificationModel {
  private static getCollection() {
    return getDb().then(db => db.collection<NotificationDocument>('zf_notifications'));
  }

  static async create(data: Omit<NotificationDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<NotificationDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('notifications.notification');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for notification');
    }
    
    const now = new Date();
    const document: NotificationDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<NotificationDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findByRecipient(recipient_id: number): Promise<NotificationDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ recipient_id }).sort({ created_at: -1 }).toArray();
  }

  static async findUnreadByRecipient(recipient_id: number): Promise<NotificationDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ recipient_id, is_read: false }).sort({ created_at: -1 }).toArray();
  }

  static async findById(id: any): Promise<NotificationDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findAll(filters: Partial<NotificationDocument> = {}): Promise<NotificationDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ created_at: -1 }).toArray();
  }

  static async markAsRead(numeric_id: number): Promise<NotificationDocument | null> {
    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { numeric_id },
      { 
        $set: { 
          is_read: true, 
          read_at: new Date(),
          updated_at: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    return result;
  }

  static async markAllAsReadForRecipient(recipient_id: number): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateMany(
      { recipient_id, is_read: false },
      { 
        $set: { 
          is_read: true, 
          read_at: new Date(),
          updated_at: new Date() 
        } 
      }
    );
  }

  static async update(numeric_id: number, data: Partial<NotificationDocument>): Promise<NotificationDocument | null> {
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

  static async countUnread(recipient_id: number): Promise<number> {
    const collection = await this.getCollection();
    return await collection.countDocuments({ recipient_id, is_read: false });
  }

  static async countUrgentUnread(recipient_id: number): Promise<number> {
    const collection = await this.getCollection();
    return await collection.countDocuments({ 
      recipient_id, 
      is_read: false, 
      priority: { $in: ['urgent', 'high'] }
    });
  }
}
