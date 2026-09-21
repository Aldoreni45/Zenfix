'use client';

import { useApi, useIsOwner } from '@/lib/hooks';
import { apiEndpoints, type DashboardData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Loader2, Settings, Globe, Shield, Database, Users, Building2, Video,
  CheckCircle2, Clock, AlertTriangle, TrendingUp, Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const isOwner = useIsOwner();
  const { data: overview, loading, error, refetch } = useApi<any>(apiEndpoints.companyOverview, null);
  const { data: dashboard } = useApi<any>(apiEndpoints.dashboard, null);

  if (!isOwner) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-gray-400 mt-1">Configure system settings and preferences</p>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-10 text-center">
          <Lock className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Owner access required</h2>
          <p className="text-gray-400 text-sm mb-6">
            System settings are restricted to the workspace owner. Contact the owner to manage these settings.
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: overview?.total_users ?? dashboard?.total_users ?? '—', icon: Users, color: 'text-cyan-400' },
    { label: 'Owners', value: overview?.owner_count ?? '—', icon: Shield, color: 'text-purple-400' },
    { label: 'Managers', value: overview?.manager_count ?? '—', icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Employees', value: overview?.employee_count ?? '—', icon: Building2, color: 'text-green-400' },
    { label: 'Clients', value: overview?.total_clients ?? dashboard?.total_clients ?? '—', icon: Globe, color: 'text-yellow-400' },
    { label: 'Videos Completed', value: overview?.completed_videos ?? '—', icon: Video, color: 'text-cyan-400' },
    { label: 'Videos Posted', value: overview?.posted_videos ?? '—', icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Pending Tasks', value: overview?.pending_tasks ?? '—', icon: Clock, color: 'text-orange-400' },
    { label: 'Overdue Tasks', value: overview?.overdue_tasks ?? '—', icon: AlertTriangle, color: 'text-red-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">System Settings</h1>
        <p className="text-gray-400 mt-1">System overview and workspace information</p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">Failed to load system overview.</p>
          <Button variant="outline" size="sm" onClick={refetch} className="border-red-500/30 text-red-400">
            Retry
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{card.value}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{card.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* System Info */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-5 w-5 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">System Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 rounded-xl p-4 flex justify-between">
                <span className="text-gray-400">Application</span>
                <span className="text-white font-medium">ZenFix</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 flex justify-between">
                <span className="text-gray-400">API Base URL</span>
                <span className="text-white font-medium break-all text-right">
                  {process.env.NEXT_PUBLIC_API_URL || '/api'}
                </span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 flex justify-between">
                <span className="text-gray-400">Backend</span>
                <span className="text-white font-medium">Next.js with MongoDB</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 flex justify-between">
                <span className="text-gray-400">Frontend</span>
                <span className="text-white font-medium">Next.js</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-xl flex items-start gap-3">
              <Settings className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-400">
                Security, notifications, and login session settings are managed through environment variables
                on the server. No in-app configuration is required.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}