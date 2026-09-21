import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { DepartmentModel } from '@/lib/mongodb/models/department';

/**
 * Format user name from user object
 */
export function formatUserName(user: any): string {
  if (!user) return '';
  return `${user.first_name} ${user.last_name}`.trim() || user.username || '';
}

/**
 * Get user name by numeric ID
 */
export async function getUserNameById(userId: number): Promise<string> {
  const user = await UserModel.findByNumericId(userId);
  return formatUserName(user);
}

/**
 * Get user details by numeric ID
 */
export async function getUserDetailsById(userId: number) {
  const user = await UserModel.findByNumericId(userId);
  if (!user) return null;
  return {
    id: user.numeric_id,
    email: user.email,
    name: formatUserName(user),
    username: user.username,
    role: user.role,
    department_id: user.department_id,
  };
}

/**
 * Get client name by numeric ID
 */
export async function getClientNameById(clientId: number): Promise<string | null> {
  const client = await ClientModel.findByNumericId(clientId);
  return client?.name || null;
}

/**
 * Get department name by numeric ID
 */
export async function getDepartmentNameById(departmentId: number): Promise<string | null> {
  const department = await DepartmentModel.findByNumericId(departmentId);
  return department?.name || null;
}

/**
 * Format status name (e.g., 'IN_PROGRESS' -> 'In Progress')
 */
export function formatStatusName(status: string): string {
  return status
    .charAt(0)
    .toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

/**
 * Format priority name (e.g., 'high' -> 'High')
 */
export function formatPriorityName(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * Format notification type name (e.g., 'task_assigned' -> 'Task Assigned')
 */
export function formatNotificationTypeName(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format action name (e.g., 'task_created' -> 'Task Created')
 */
export function formatActionName(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format entity name (e.g., 'task' -> 'Task')
 */
export function formatEntityName(entity: string): string {
  return entity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
