import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  head?: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      enum: ['Marketing', 'SEO', 'Development', 'Design', 'Sales', 'HR'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    head: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
DepartmentSchema.index({ name: 1 });

const Department: Model<IDepartment> = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);

export default Department;
