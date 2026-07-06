'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }

    if (status === 'authenticated') {
      fetchTasks();
    }
  }, [status]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarDays = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({ day: i, isCurrentMonth: true });
    }

    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({ day: i, isCurrentMonth: false });
    }

    return calendarDays;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const calendarDays = getDaysInMonth(currentDate);
  const today = new Date();

  const getTasksForDay = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const upcomingEvents = tasks
    .filter((task) => task.deadline && new Date(task.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
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
        <div className="flex items-center gap-3">
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
          {(session?.user as any)?.role === 'admin' && (
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-400" />
            </button>
            <h2 className="text-lg font-semibold text-white">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-white/10 text-slate-400 hover:text-white">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {days.map((day) => (
            <div key={day} className="p-4 text-center text-sm font-medium text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((calendarDay, index) => {
            const isToday = calendarDay.isCurrentMonth &&
                           calendarDay.day === today.getDate() &&
                           currentDate.getMonth() === today.getMonth() &&
                           currentDate.getFullYear() === today.getFullYear();

            return (
              <div
                key={index}
                className={cn(
                  'min-h-[120px] p-2 border-b border-r border-white/5 transition-colors',
                  !calendarDay.isCurrentMonth && 'bg-slate-950/30',
                  calendarDay.isCurrentMonth && 'hover:bg-white/5'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isToday
                        ? 'w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                        : calendarDay.isCurrentMonth
                        ? 'text-white'
                        : 'text-slate-600'
                    )}
                  >
                    {calendarDay.day}
                  </span>
                  {calendarDay.isCurrentMonth && (session?.user as any)?.role === 'admin' && (
                    <button className="p-1 hover:bg-white/10 rounded opacity-0 hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                </div>

                {getTasksForDay(calendarDay.day, calendarDay.isCurrentMonth).map((task) => (
                  <div
                    key={task._id}
                    className={cn(
                      'px-2 py-1 rounded text-xs truncate cursor-pointer hover:opacity-80 mb-0.5',
                      task.priority === 'high' || task.priority === 'critical'
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                        : task.priority === 'medium'
                        ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                        : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                    )}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No upcoming deadlines</p>
          ) : (
            upcomingEvents.map((task) => {
              const daysUntil = Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        task.priority === 'high' || task.priority === 'critical' ? 'bg-red-400' :
                        task.priority === 'medium' ? 'bg-yellow-400' : 'bg-cyan-400'
                      )}
                    />
                    <div>
                      <p className="text-white font-medium">{task.title}</p>
                      <p className="text-sm text-slate-400">
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
