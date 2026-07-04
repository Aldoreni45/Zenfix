import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(1, 'Task description is required').max(5000, 'Description cannot exceed 5000 characters'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignedTo: z.string().min(1, 'Assignee is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  estimatedHours: z.number().min(0, 'Estimated hours cannot be negative').optional(),
  department: z.enum(['Marketing', 'SEO', 'Development', 'Design', 'Sales', 'HR']).optional(),
  tags: z.array(z.string()).optional(),
  checklist: z.array(z.object({
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title cannot exceed 200 characters').optional(),
  description: z.string().min(1, 'Task description is required').max(5000, 'Description cannot exceed 5000 characters').optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedTo: z.string().min(1, 'Assignee is required').optional(),
  deadline: z.string().min(1, 'Deadline is required').optional(),
  estimatedHours: z.number().min(0, 'Estimated hours cannot be negative').optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'rejected', 'not_completed', 'overdue', 'cancelled']).optional(),
  department: z.enum(['Marketing', 'SEO', 'Development', 'Design', 'Sales', 'HR']).optional(),
  tags: z.array(z.string()).optional(),
  checklist: z.array(z.object({
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
});

export const completeTaskSchema = z.object({
  completionNotes: z.string().min(1, 'Completion notes are required').max(2000, 'Notes cannot exceed 2000 characters'),
  attachments: z.array(z.string()).optional(),
});

export const notCompletedTaskSchema = z.object({
  reason: z.string().min(30, 'Reason must be at least 30 characters').max(500, 'Reason cannot exceed 500 characters'),
  reasonType: z.enum(['client_delayed', 'waiting_approval', 'technical_issue', 'need_resources', 'blocked', 'other']),
});

export const commentSchema = z.object({
  message: z.string().min(1, 'Comment message is required').max(2000, 'Message cannot exceed 2000 characters'),
  attachments: z.array(z.string()).optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type NotCompletedTaskInput = z.infer<typeof notCompletedTaskSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
