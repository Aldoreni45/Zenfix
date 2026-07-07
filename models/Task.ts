import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'not_completed' | 'overdue' | 'cancelled';
  assignedBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  deadline: Date;
  estimatedHours?: number;
  department?: 'Marketing' | 'SEO' | 'Development' | 'Design' | 'Sales' | 'HR';
  completionNotes?: string;
  notCompletedReason?: string;
  attachments?: string[];
  checklist?: Array<{ text: string; completed: boolean }>;
  tags?: string[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'rejected', 'not_completed', 'overdue', 'cancelled'],
      default: 'pending',
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Task deadline is required'],
    },
    department: {
      type: String,
      enum: ['Marketing', 'SEO', 'Development', 'Design', 'Sales', 'HR'],
      required: false,
    },
    estimatedHours: {
      type: Number,
      min: [0, 'Estimated hours cannot be negative'],
      default: 0,
    },
    completionNotes: {
      type: String,
      maxlength: [2000, 'Completion notes cannot exceed 2000 characters'],
      default: '',
    },
    notCompletedReason: {
      type: String,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      default: '',
    },
    attachments: {
      type: [String],
      default: [],
    },
    checklist: {
      type: [{ text: String, completed: Boolean }],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ assignedBy: 1 });
TaskSchema.index({ priority: 1, status: 1 });
TaskSchema.index({ deadline: 1 });
TaskSchema.index({ status: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
