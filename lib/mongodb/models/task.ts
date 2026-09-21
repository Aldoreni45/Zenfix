import { getDb, getNextNumericId } from '../client';
import { TaskPriority, TaskStatus } from '../../types/models';

export interface TaskDocument {
  _id?: any;
  numeric_id: number;
  task_id: string;
  title: string;
  description?: string;
  client_id?: number;
  video_id?: number;
  video_stage_id?: number;
  assigned_to_id?: number;
  assigned_by_id?: number;
  assigned_manager_id?: number;
  created_by_id?: number;
  department_id?: number;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: Date;
  original_due_date?: Date;
  due_time?: string;
  started_at?: Date;
  completed_at?: Date;
  parent_task_id?: number;
  carried_forward_from_id?: number;
  carry_forward_count: number;
  notes?: string;
  attachments: string[];
  estimated_hours: number;
  actual_hours?: number;
  rejection_reason?: string;
  rejection_count: number;
  task_type: string;
  drive_link?: string;
  completion_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TaskCommentDocument {
  _id?: any;
  numeric_id: number;
  task_id: number;
  author_id: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
}

export class TaskModel {
  private static getCollection() {
    return getDb().then(db => db.collection<TaskDocument>('zf_tasks'));
  }

  static async create(data: Omit<TaskDocument, '_id' | 'numeric_id' | 'task_id' | 'created_at' | 'updated_at'>): Promise<TaskDocument> {
    const collection = await this.getCollection();
    
    // Clean up any documents with null numeric_id that might cause duplicate key errors
    await collection.deleteMany({ numeric_id: null } as any);
    
    const numeric_id = await getNextNumericId('tasks.task');
    
    if (!numeric_id) {
      throw new Error('Failed to generate numeric_id for task');
    }
    
    const now = new Date();
    const document: TaskDocument = {
      ...data,
      numeric_id,
      task_id: `T-${numeric_id.toString().padStart(6, '0')}`,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByNumericId(numeric_id: number): Promise<TaskDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async findByTaskId(task_id: string): Promise<TaskDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ task_id });
  }

  static async findById(id: any): Promise<TaskDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findAll(filters: Partial<TaskDocument> = {}): Promise<TaskDocument[]> {
    const collection = await this.getCollection();
    return await collection.find(filters).sort({ created_at: -1 }).toArray();
  }

  static async update(numeric_id: number, data: Partial<TaskDocument>): Promise<TaskDocument | null> {
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

export class TaskCommentModel {
  private static getCollection() {
    return getDb().then(db => db.collection<TaskCommentDocument>('zf_task_comments'));
  }

  static async create(data: Omit<TaskCommentDocument, '_id' | 'numeric_id' | 'created_at' | 'updated_at'>): Promise<TaskCommentDocument> {
    const collection = await this.getCollection();
    const numeric_id = await getNextNumericId('tasks.taskcomment');
    
    const now = new Date();
    const document: TaskCommentDocument = {
      ...data,
      numeric_id,
      created_at: now,
      updated_at: now,
    };
    
    const result = await collection.insertOne(document);
    document._id = result.insertedId;
    return document;
  }

  static async findByTask(task_id: number): Promise<TaskCommentDocument[]> {
    const collection = await this.getCollection();
    return await collection.find({ task_id }).sort({ created_at: 1 }).toArray();
  }

  static async findByNumericId(numeric_id: number): Promise<TaskCommentDocument | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ numeric_id });
  }

  static async update(numeric_id: number, data: Partial<TaskCommentDocument>): Promise<TaskCommentDocument | null> {
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
