import { ClientModel } from '@/lib/mongodb/models/client';
import { UserModel } from '@/lib/mongodb/models/user';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { handleValidationError } from './error-handler';
import { NextResponse } from 'next/server';

/**
 * Validate that a client exists by numeric ID
 */
export async function validateClientExists(clientId: number): Promise<NextResponse | null> {
  const client = await ClientModel.findByNumericId(clientId);
  if (!client) {
    return handleValidationError('Client not found');
  }
  return null;
}

/**
 * Validate that a user exists by numeric ID
 */
export async function validateUserExists(userId: number): Promise<NextResponse | null> {
  const user = await UserModel.findByNumericId(userId);
  if (!user) {
    return handleValidationError('User not found');
  }
  return null;
}

/**
 * Validate that a department exists by numeric ID
 */
export async function validateDepartmentExists(departmentId: number): Promise<NextResponse | null> {
  const department = await DepartmentModel.findByNumericId(departmentId);
  if (!department) {
    return handleValidationError('Department not found');
  }
  return null;
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(body: any, fields: string[]): NextResponse | null {
  const missing = fields.filter(field => !body[field]);
  if (missing.length > 0) {
    return handleValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate that a value is a valid role
 */
export function isValidRole(role: string): boolean {
  return ['owner', 'manager', 'employee'].includes(role);
}

/**
 * Validate that a value is a valid status (common statuses)
 */
export function isValidStatus(status: string): boolean {
  const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected', 'overdue'];
  return validStatuses.includes(status);
}

/**
 * Validate that a value is a valid priority
 */
export function isValidPriority(priority: string): boolean {
  const validPriorities = ['low', 'normal', 'high', 'urgent'];
  return validPriorities.includes(priority);
}
