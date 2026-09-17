'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Search, UserPlus, Shield, Mail, Building2, Loader2, Trash2, AlertCircle,
} from 'lucide-react';
import { useManagers, useIsOwner } from '@/lib/hooks';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';

export default function ManagersPage() {
  const { data: users, loading, error, refetch } = useManagers();
  const isOwner = useIsOwner();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = (users || []).filter((u: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this manager?')) return;
    setDeletingId(userId);
    const res = await api.delete(apiEndpoints.user(userId));
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      toast.success('Manager deleted successfully');
      refetch();
    }
    setDeletingId(null);
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
          <h1 className="text-3xl font-bold text-white">Managers</h1>
          <p className="text-gray-400 mt-1">Manage your team managers</p>
        </div>
        {isOwner && (
          <Link href="/adminzenfix/users/create">
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Manager
            </Button>
          </Link>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">Failed to load managers.</p>
          <Button variant="outline" size="sm" onClick={refetch} className="border-red-500/30 text-red-400">
            Retry
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search managers by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {(!error && filtered.length === 0) ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No managers found</p>
          </div>
        ) : (
          filtered.map((u: any) => (
            <div
              key={u.id}
              className="bg-slate-900/50 border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                    {(u.full_name || u.username || 'U')[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {u.full_name || u.username}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1 min-w-0">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{u.email || '—'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {u.assigned_clients_count !== undefined
                          ? `${u.assigned_clients_count} clients`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    Manager
                  </span>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={deletingId === u.id}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      {deletingId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {filtered.length === 0 && !error && users && users.length > 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <AlertCircle className="h-8 w-8 mb-2 text-gray-600" />
            <p>No managers match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}