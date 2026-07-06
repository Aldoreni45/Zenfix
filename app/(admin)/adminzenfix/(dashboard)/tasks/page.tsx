'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Filter, Search, Clock, AlertCircle, CheckCircle2, MoreVertical, Kanban, LayoutList, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STATUS_COLOR: Record<string, string> = { completed: 'bg-green-500/20 text-green-400', in_progress: 'bg-blue-500/20 text-blue-400', pending: 'bg-yellow-500/20 text-yellow-400', overdue: 'bg-red-500/20 text-red-400', rejected: 'bg-red-500/20 text-red-400', not_completed: 'bg-orange-500/20 text-orange-400' };
const PRIORITY_COLOR: Record<string, string> = { critical: 'bg-red-500/20 text-red-400', high: 'bg-orange-500/20 text-orange-400', medium: 'bg-yellow-500/20 text-yellow-400', low: 'bg-green-500/20 text-green-400' };
const PRIORITY_DOT: Record<string, string> = { critical: 'bg-red-400', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-green-400' };

const KANBAN_COLS = [
  { key: 'pending', label: 'Pending', border: 'border-yellow-500/30 text-yellow-400' },
  { key: 'in_progress', label: 'In Progress', border: 'border-blue-500/30 text-blue-400' },
  { key: 'completed', label: 'Completed', border: 'border-green-500/30 text-green-400' },
  { key: 'not_completed', label: 'Not Completed', border: 'border-orange-500/30 text-orange-400' },
  { key: 'rejected', label: 'Rejected', border: 'border-red-500/30 text-red-400' },
];

function KanbanCard({ task }: { task: any }) {
  const isOverdue = task.status !== 'completed' && task.deadline && new Date(task.deadline) < new Date();
  return (
    <Link href={`/adminzenfix/tasks/${task._id}`}>
      <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group space-y-3">
        <div className="flex items-start gap-2">
          <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', PRIORITY_DOT[task.priority] || 'bg-slate-400')} />
          <p className="text-white text-sm font-medium leading-snug group-hover:text-cyan-300 transition-colors line-clamp-2">{task.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', PRIORITY_COLOR[task.priority] || 'bg-slate-500/20 text-slate-400')}>{task.priority}</span>
          {task.deadline && (
            <span className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-red-400' : 'text-slate-500')}>
              <Clock className="h-3 w-3" />{new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        {task.assignedTo?.name && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{task.assignedTo.name[0]}</div>
            <span className="text-xs text-slate-500 truncate">{task.assignedTo.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function TasksPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priority, setPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const userRole = (session?.user as any)?.role || 'worker';
  const canCreate = userRole === 'admin';

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/adminzenfix');
    if (status === 'authenticated') fetchTasks();
  }, [status, filter, search]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (search) params.append('search', search);
      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) { console.error('Failed to fetch tasks:', error); }
    finally { setLoading(false); }
  };

  const filtered = priority === 'all' ? tasks : tasks.filter(t => t.priority === priority);
  const kanbanGroups = KANBAN_COLS.map(col => ({ ...col, tasks: filtered.filter(t => t.status === col.key) }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-cyan" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400 mt-1">{filtered.length} task{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button onClick={() => setViewMode('list')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', viewMode === 'list' ? 'bg-electric-cyan/20 text-electric-cyan' : 'text-gray-400 hover:text-white')}>
              <LayoutList className="h-3.5 w-3.5" /> List
            </button>
            <button onClick={() => setViewMode('kanban')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', viewMode === 'kanban' ? 'bg-electric-cyan/20 text-electric-cyan' : 'text-gray-400 hover:text-white')}>
              <Kanban className="h-3.5 w-3.5" /> Board
            </button>
          </div>
          {canCreate && (
            <Link href="/adminzenfix/tasks/create">
              <Button className="bg-gradient-to-r from-electric-cyan to-purple">
                <Plus className="h-4 w-4 mr-2" />Create Task
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search tasks..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="pl-10 bg-surface/50 border-white/10 text-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'in_progress', 'completed'].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors', filter === s ? 'bg-electric-cyan/20 text-electric-cyan' : 'bg-white/5 text-gray-400 hover:text-white')}>
              {s.replace('_', ' ')}
            </button>
          ))}
          <div className="relative">
            <button onClick={() => setShowPriorityMenu(!showPriorityMenu)} className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border', priority !== 'all' ? 'bg-purple/20 text-purple border-purple/30' : 'bg-white/5 text-gray-400 border-white/5 hover:text-white')}>
              <Filter className="h-3.5 w-3.5" />{priority === 'all' ? 'Priority' : priority}<ChevronDown className="h-3 w-3" />
            </button>
            {showPriorityMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPriorityMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                  {['all', 'low', 'medium', 'high', 'critical'].map(p => (
                    <button key={p} onClick={() => { setPriority(p); setShowPriorityMenu(false); }} className={cn('w-full text-left px-4 py-2.5 text-sm capitalize transition-colors hover:bg-white/5', priority === p ? 'text-electric-cyan' : 'text-gray-300')}>
                      {p === 'all' ? 'All priorities' : p}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No tasks found</p>
            </div>
          ) : (
            filtered.map((task) => {
              const isOverdue = task.status !== 'completed' && task.deadline && new Date(task.deadline) < new Date();
              return (
                <Link key={task._id} href={`/adminzenfix/tasks/${task._id}`} className="block">
                  <div className="glass-card rounded-2xl p-6 hover:scale-[1.01] transition-transform cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-white truncate">{task.title}</h3>
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', PRIORITY_COLOR[task.priority])}>{task.priority}</span>
                          {isOverdue && <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400"><AlertCircle className="h-3 w-3" />Overdue</span>}
                        </div>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          {task.deadline && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                          {task.assignedTo?.name && (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{task.assignedTo.name[0]}</div>
                              <span>{task.assignedTo.name}</span>
                            </div>
                          )}
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_COLOR[task.status] || 'bg-gray-500/20 text-gray-400')}>{task.status.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-gray-400" /></Button>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {kanbanGroups.map((col) => (
              <div key={col.key} className="w-72 flex-shrink-0">
                <div className={cn('flex items-center justify-between px-4 py-3 rounded-xl border mb-3 bg-slate-900/50', col.border)}>
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{col.tasks.length}</span>
                </div>
                <div className="space-y-3">
                  {col.tasks.length === 0 ? (
                    <div className="border border-dashed border-white/10 rounded-xl p-6 text-center">
                      <p className="text-slate-600 text-sm">No tasks</p>
                    </div>
                  ) : (
                    col.tasks.map(task => <KanbanCard key={task._id} task={task} />)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
