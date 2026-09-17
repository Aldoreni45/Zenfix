'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, MoreHorizontal, Users, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClients, useIsOwner, useIsManager } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export default function ClientsPage() {
  const { data: clients, loading, error, refetch } = useClients();
  const canManage = useIsOwner() || useIsManager();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredClients = clients?.filter((client: any) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_person.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading clients…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 mt-1">Manage your client relationships and monthly targets</p>
        </div>
        {canManage && (
          <Link href="/adminzenfix/clients/create">
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800/50 border border-white/10 text-white rounded-lg px-4 py-2"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Clients</p>
              <p className="text-2xl font-bold text-white mt-1">{clients?.length || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Clients</p>
              <p className="text-2xl font-bold text-white mt-1">
                {clients?.filter((c: any) => c.status === 'active').length || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Monthly Targets</p>
              <p className="text-2xl font-bold text-white mt-1">
                {clients?.reduce((sum: number, c: any) => sum + (c.current_month_target?.target_videos || 0), 0) || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Client</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Contact</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Instagram</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Manager</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Progress</th>
                <th className="text-right p-4 text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No clients found
                  </td>
                </tr>
              ) : (
                filteredClients.map((client: any) => (
                  <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <Link href={`/adminzenfix/clients/${client.id}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {client.name[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium">{client.name}</p>
                          <p className="text-slate-500 text-xs">{client.company_name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4">
                      <p className="text-white text-sm">{client.contact_person}</p>
                      <p className="text-slate-500 text-xs">{client.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white text-sm">@{client.instagram_username || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white text-sm">{client.manager_name || 'Unassigned'}</p>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium capitalize',
                        client.status === 'active' ? 'bg-green-500/10 text-green-400' :
                        client.status === 'inactive' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-slate-500/10 text-slate-400'
                      )}>
                        {client.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {client.current_progress ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{client.current_progress.completed}/{client.current_progress.target}</span>
                            <span className="text-white font-medium">{client.current_progress.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={cn('h-2 rounded-full transition-all', getProgressColor(client.current_progress.progress_percentage))}
                              style={{ width: `${client.current_progress.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">No target set</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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