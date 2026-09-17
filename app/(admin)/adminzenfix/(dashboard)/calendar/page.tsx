'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTasks } from '@/lib/hooks';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function keyOfDate(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function priorityClass(priority: string) {
  if (priority === 'high' || priority === 'urgent' || priority === 'critical') {
    return 'bg-red-500/10 border border-red-500/20 text-red-400';
  }
  if (priority === 'medium') {
    return 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400';
  }
  return 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400';
}

function priorityDot(priority: string) {
  if (priority === 'high' || priority === 'urgent' || priority === 'critical') return 'bg-red-400';
  if (priority === 'medium') return 'bg-yellow-400';
  return 'bg-cyan-400';
}

export default function CalendarPage() {
  const { data: tasks, loading, error, refetch } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const activeTasks = (tasks || []).filter((t: any) => t.status !== 'completed');
  const today = new Date();

  const getTasksForDay = (date: Date) => {
    const key = keyOfDate(date);
    return activeTasks.filter((t: any) => {
      if (!t.due_date) return false;
      const d = new Date(`${t.due_date}T00:00:00`);
      return keyOfDate(d) === key;
    });
  };

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === 'month') next.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      else if (view === 'week') next.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      else next.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
      return next;
    });
  };

  // Month grid
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
  const calendarDays = [] as { day: number; isCurrentMonth: boolean; date: Date }[];
  for (let i = firstDay.getDay() - 1; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i);
    calendarDays.push({ day: d.getDate(), isCurrentMonth: false, date: d });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i) });
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i) });
  }

  // Week: 7 days containing currentDate
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = DAYS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const upcoming = [...activeTasks]
    .filter((t: any) => t.due_date && !t.is_overdue)
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 6);

  const headerLabel =
    view === 'month'
      ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : view === 'week'
      ? weekDays[0].toLocaleDateString() + ' – ' + weekDays[6].toLocaleDateString()
      : currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const renderTaskChip = (t: any, compact = true) => (
    <Link
      key={t.id}
      href={`/adminzenfix/tasks/${t.id}`}
      className={cn(
        'block px-2 py-1 rounded text-xs truncate cursor-pointer hover:opacity-80 mb-0.5 text-left',
        priorityClass(t.priority)
      )}
      title={`${t.title} (${t.priority})`}
    >
      {t.is_overdue && 'Overdue: '}
      {t.title}
      {!compact && (
        <span className="block text-[10px] text-slate-500 mt-0.5">
          {t.assigned_to_name || 'Unassigned'} · {t.status}
        </span>
      )}
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-slate-400 mt-1">Manage your schedule and deadlines</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 border border-white/10 rounded-lg p-1">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                view === v
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">Failed to load calendar tasks.</p>
          <Button variant="outline" size="sm" onClick={refetch} className="border-red-500/30 text-red-400">
            Retry
          </Button>
        </div>
      )}

      {/* Calendar Grid */}
      {!error && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('prev')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-slate-400" />
              </button>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-cyan-400" />
                {headerLabel}
              </h2>
              <button
                onClick={() => navigate('next')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>

          {view === 'month' && (
            <>
              {/* Days Header */}
              <div className="grid grid-cols-7 border-b border-white/5">
                {DAYS.map((day) => (
                  <div key={day} className="p-4 text-center text-sm font-medium text-slate-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {calendarDays.map((cell, index) => {
                  const isToday =
                    cell.isCurrentMonth &&
                    keyOfDate(cell.date) === keyOfDate(today);
                  const dayTasks = getTasksForDay(cell.date);
                  return (
                    <div
                      key={index}
                      className={cn(
                        'min-h-[120px] p-2 border-b border-r border-white/5 transition-colors',
                        !cell.isCurrentMonth && 'bg-slate-950/30',
                        cell.isCurrentMonth && 'hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isToday
                              ? 'w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                              : cell.isCurrentMonth
                              ? 'text-white'
                              : 'text-slate-600'
                          )}
                        >
                          {cell.day}
                        </span>
                      </div>
                      {dayTasks.slice(0, 3).map((t) => renderTaskChip(t))}
                      {dayTasks.length > 3 && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          +{dayTasks.length - 3} more
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {view === 'week' && (
            <>
              <div className="grid grid-cols-7 border-b border-white/5">
                {weekDays.map((d) => (
                  <div
                    key={d.toDateString()}
                    className="p-3 text-center text-sm"
                  >
                    <div className="text-slate-400 font-medium">{DAYS[d.getDay()]}</div>
                    <div
                      className={cn(
                        'mt-1 w-8 mx-auto h-8 flex items-center justify-center rounded-full',
                        keyOfDate(d) === keyOfDate(today)
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                          : 'text-white'
                      )}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {weekDays.map((d) => (
                  <div
                    key={d.toDateString()}
                    className="min-h-[260px] p-2 border-r border-white/5 last:border-r-0"
                  >
                    {getTasksForDay(d)
                      .slice(0, 6)
                      .map((t) => renderTaskChip(t))}
                    {getTasksForDay(d).length > 6 && (
                      <p className="text-[10px] text-slate-500">{getTasksForDay(d).length - 6} more</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {view === 'day' && (
            <div className="p-6 min-h-[300px]">
              {getTasksForDay(currentDate).length === 0 ? (
                <p className="text-slate-400 text-center py-12">No tasks due on this day</p>
              ) : (
                <div className="space-y-2 max-w-2xl">
                  {getTasksForDay(currentDate).map((t) => renderTaskChip(t, false))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Deadlines */}
      {!error && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No upcoming deadlines</p>
            ) : (
              upcoming.map((task: any) => {
                const due = new Date(`${task.due_date}T00:00:00`);
                const daysUntil = Math.ceil((due.getTime() - Date.now()) / 86400000);
                return (
                  <Link
                    key={task.id}
                    href={`/adminzenfix/tasks/${task.id}`}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn('w-2 h-2 rounded-full shrink-0', priorityDot(task.priority))} />
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{task.title}</p>
                        <p className="text-sm text-slate-400">
                          {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ·{' '}
                          {daysUntil === 0
                            ? 'Today'
                            : daysUntil === 1
                            ? 'Tomorrow'
                            : `In ${daysUntil} days`}
                          {task.assigned_to_name && ` · ${task.assigned_to_name}`}
                        </p>
                      </div>
                    </div>
                    {task.is_overdue && (
                      <span className="text-xs text-red-400 flex items-center gap-1 shrink-0">
                        <AlertCircle className="h-3 w-3" /> Overdue
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}