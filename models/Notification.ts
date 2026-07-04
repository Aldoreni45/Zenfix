import mongoose, { Schema, Model, Document } from 'mongoose';

export interface INotification extends Document {
  receiver: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'task_rejected' | 'task_overdue' | 'deadline_reminder' | 'user_created' | 'system';
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['task_assigned', 'task_updated', 'task_completed', 'task_rejected', 'task_overdue', 'deadline_reminder', 'user_created', 'system'],
      default: 'system',
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
NotificationSchema.index({ receiver: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
