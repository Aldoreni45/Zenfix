'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  UserPlus,
  Users,
  Crown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUsers, useIsOwner } from '@/lib/hooks';

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  manager: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  employee: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  inactive: 'bg-slate-500/10 text-slate-400',
  suspended: 'bg-red-500/10 text-red-400',
};

export default function UsersPage() {
  const { data: allUsers, loading, error, refetch } = useUsers();
  const isOwner = useIsOwner();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const users = (allUsers || []).filter((u: any) => {
    const matchesRole = filter === 'all' || u.role === filter;
    if (!matchesRole) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.department_name || '').toLowerCase().includes(q)
    );
  });

  const counts = {
    total: (allUsers || []).length,
    owner: (allUsers || []).filter((u: any) => u.role === 'owner').length,
  };

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
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">Manage team members and permissions</p>
        </div>
        {isOwner && (
          <Link href="/adminzenfix/users/create">
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Crown className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{counts.owner}</p>
              <p className="text-sm text-gray-400">Owners</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{counts.total}</p>
              <p className="text-sm text-gray-400">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">Failed to load users.</p>
          <Button variant="outline" size="sm" onClick={refetch} className="border-red-500/30 text-red-400">
            Retry
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, username, email or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'owner', label: 'Owners' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setFilter(r.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === r.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Role</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Department</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {(!error && users.length === 0) ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {(u.full_name || u.username || 'U')[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {u.full_name || u.username || 'Unnamed'}
                          </p>
                          <p className="text-sm text-gray-400">{u.email || u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize border', ROLE_COLORS[u.role] || 'bg-slate-500/10 text-slate-400')}>
                        {u.role_name || u.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{u.department_name || '—'}</td>
                    <td className="p-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_COLORS[u.status] || 'bg-slate-500/10 text-slate-400')}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}