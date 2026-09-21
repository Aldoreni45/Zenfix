const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

export function isValidDate(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function dateOnlyLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayNumber(date: Date): number {
  return Math.floor(dateOnlyLocal(date).getTime() / DAY_MS);
}

function isValidCalendarDate(date: Date, year: number, month: number, day: number): boolean {
  return (
    isValidDate(date) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Parse a due date into a local calendar Date that preserves the exact
 * selected day. Never uses `new Date('YYYY-MM-DD')` (which is parsed as UTC
 * midnight and shifts the visible day in negative-offset timezones) and never
 * trusts a raw ISO datetime as a plain calendar date.
 */
export function parseDueDate(value: unknown): Date | null {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    return isValidDate(value) ? dateOnlyLocal(value) : null;
  }

  if (typeof value === 'string') {
    const match = DATE_ONLY_RE.exec(value.trim());
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const parsed = new Date(year, month - 1, day);
      return isValidCalendarDate(parsed, year, month, day) ? parsed : null;
    }
    const parsed = new Date(value);
    return isValidDate(parsed) ? dateOnlyLocal(parsed) : null;
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    return isValidDate(parsed) ? dateOnlyLocal(parsed) : null;
  }

  return null;
}

/**
 * Normalize a due-date value for storage as a Date at UTC midnight of the
 * selected calendar day. Canonical comparison basis for overdue logic.
 */
export function parseDueDateUTC(value: unknown): Date | null {
  const local = parseDueDate(value);
  if (!local) return null;
  return new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
}

/**
 * Serialize a stored Date to its calendar day as `YYYY-MM-DD` using UTC
 * components (dates are stored at UTC midnight).
 */
export function toDateOnlyISO(date: Date | null | undefined): string | null {
  if (!date || !isValidDate(date)) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Date-only overdue check, independent of server/browser timezone and of the
 * time of day. A task due today is never overdue until the next calendar day.
 */
export function isOverdueByDate(due_date: Date | null | undefined, now: Date = new Date()): boolean {
  if (!due_date || !isValidDate(due_date)) return false;
  const due = Date.UTC(due_date.getUTCFullYear(), due_date.getUTCMonth(), due_date.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return due < today;
}

/**
 * Whole calendar-day difference (positive = future, 0 = today, negative = past).
 */
export function getDaysUntilDue(value: unknown, today: Date = new Date()): number | null {
  const due = parseDueDate(value);
  if (!due) return null;
  return Math.round(dayNumber(due) - dayNumber(today));
}

export interface DueDateStatus {
  tone: 'none' | 'normal' | 'today' | 'overdue';
  label: string;
}

export function getDueDateStatus(value: unknown, today: Date = new Date()): DueDateStatus {
  const due = parseDueDate(value);
  if (!due) return { tone: 'none', label: 'No due date' };

  const days = getDaysUntilDue(due, today);
  if (days === null) return { tone: 'none', label: 'No due date' };

  if (days <= -1) {
    const count = Math.abs(days);
    return { tone: 'overdue', label: `Overdue by ${count} day${count === 1 ? '' : 's'}` };
  }
  if (days === 0) return { tone: 'today', label: 'Due today' };
  return { tone: 'normal', label: `Due in ${days} day${days === 1 ? '' : 's'}` };
}

export function formatDueDate(value: unknown): string {
  const parsed = parseDueDate(value);
  if (!parsed) return 'No due date';
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Local calendar date as `YYYY-MM-DD` (timezone-safe; never derived from
 * `toISOString()`, which can shift the day for UTC-offset timezones).
 */
export function todayLocalISO(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}