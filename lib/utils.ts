import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolve a human-readable display name for a user record.
 *
 * Prefers the user's real name (`first_name` + `last_name`), then any stored
 * `full_name`/`name`, and only falls back to the username or email when the
 * user has no name on record. Used for employee/assignee dropdowns so options
 * identify the actual person instead of their role.
 */
export function getUserDisplayName(user: any, fallback = 'Unknown user'): string {
  if (!user) return fallback;

  const first = typeof user.first_name === 'string' ? user.first_name.trim() : '';
  const last = typeof user.last_name === 'string' ? user.last_name.trim() : '';
  const fullName = `${first} ${last}`.trim();
  if (fullName) return fullName;

  for (const key of ['full_name', 'name', 'username', 'email'] as const) {
    const value = user[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return fallback;
}
