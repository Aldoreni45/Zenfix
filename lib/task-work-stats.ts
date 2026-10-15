/**
 * Work-efficiency calculations for tasks.
 *
 * A task's efficiency is derived from how long it has been "elapsed" versus how
 * long it was put "on hold". Because a task can be running (or currently on
 * hold) when the UI reads it, these stats depend on the current time — they are
 * therefore computed on demand (server response + live client ticks) rather
 * than relying only on the values persisted when the task was last paused or
 * completed.
 *
 * This module is intentionally free of any server-only imports so the exact
 * same calculation is used by the API routes and by the React components.
 */

export interface HoldPeriod {
  started_at?: Date | string | number | null;
  ended_at?: Date | string | number | null;
  duration_seconds?: number | null;
}

export interface TaskWorkStatsInput {
  status?: string | null;
  started_at?: Date | string | number | null;
  completed_at?: Date | string | number | null;
  created_at?: Date | string | number | null;
  hold_periods?: HoldPeriod[] | null;
  total_hold_seconds?: number | null;
}

export interface TaskWorkStats {
  total_hold_seconds: number;
  actual_work_seconds: number;
  work_efficiency_percent: number;
}

const EMPTY_STATS: TaskWorkStats = {
  total_hold_seconds: 0,
  actual_work_seconds: 0,
  work_efficiency_percent: 0,
};

function toMs(value: Date | string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

/**
 * Compute live work stats for a task.
 *
 * - `total_hold_seconds`: every hold period, with the still-open period
 *   (no `ended_at`) accumulating up to `now`.
 * - `actual_work_seconds`: elapsed time minus hold time.
 * - `work_efficiency_percent`: `actual_work / elapsed`, clamped to 0–100.
 *
 * `now` may be a Date, epoch millis, or ISO string; defaults to the current
 * time. Pass a ticking value on the client to animate the numbers live.
 */
export function computeTaskWorkStats(
  task: TaskWorkStatsInput | null | undefined,
  now: Date | number | string = Date.now()
): TaskWorkStats {
  if (!task) return { ...EMPTY_STATS };

  const nowMs = toMs(now) ?? Date.now();

  // Sum every hold period. Open periods keep accruing until `now`.
  let totalHoldSeconds = 0;
  const holdPeriods = Array.isArray(task.hold_periods) ? task.hold_periods : [];
  for (const period of holdPeriods) {
    const startMs = toMs(period?.started_at);
    if (startMs == null) continue;
    const endMs = toMs(period?.ended_at) ?? nowMs;
    const seconds =
      typeof period?.duration_seconds === 'number' && period.duration_seconds >= 0
        ? Math.floor(period.duration_seconds)
        : Math.floor((endMs - startMs) / 1000);
    if (seconds > 0) totalHoldSeconds += seconds;
  }

  // Keep any previously persisted total when hold_periods are missing/partial
  // (e.g. legacy rows written before periods were tracked).
  const storedHold =
    typeof task.total_hold_seconds === 'number' ? Math.floor(task.total_hold_seconds) : 0;
  if (storedHold > totalHoldSeconds) totalHoldSeconds = storedHold;

  // Elapsed runs from when the task started (fallback: creation) until it was
  // completed, or until `now` while it is still running.
  const startMs = toMs(task.started_at) ?? toMs(task.created_at) ?? nowMs;
  const endMs = toMs(task.completed_at) ?? nowMs;
  const totalElapsedSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));

  const actualWorkSeconds = Math.max(0, totalElapsedSeconds - totalHoldSeconds);
  const workEfficiencyPercent =
    totalElapsedSeconds > 0
      ? Math.round(Math.max(0, Math.min(100, (actualWorkSeconds / totalElapsedSeconds) * 100)))
      : 0;

  return {
    total_hold_seconds: totalHoldSeconds,
    actual_work_seconds: actualWorkSeconds,
    work_efficiency_percent: workEfficiencyPercent,
  };
}
