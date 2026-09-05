import { Schema, model, Document } from 'mongoose';

export interface TaskDoc extends Document {
  title: string;
  description?: string;
  assignedTo: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed';
  isDeleted: boolean;
  deletedAt?: Date | null;
}

const TaskSchema = new Schema<TaskDoc>(
  {
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Task = model<TaskDoc>('Task', TaskSchema);
