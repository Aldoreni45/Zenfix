'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Loader2, Calendar, Target, Video, ChevronLeft, ChevronRight,
  BarChart3, CheckCircle2, AlertTriangle, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useIsOwner, useIsManager } from '@/lib/hooks';
import { cn } from '@/lib/utils';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface ProtocolListItem {
  id: number;
  numeric_id: number;
  client: number;
  client_name: string;
  month: number;
  year: number;
  target_videos: number;
  status: string;
  workflow_progress: number;
  fully_completed_videos: number;
  video_status_counts: { not_started: number; in_progress: number; posted: number };
  total_videos: number;
  created_at: string;
  updated_at: string;
}

export default function VideoProtocolPage() {
  const router = useRouter();
  const isOwner = useIsOwner();
  const isManager = useIsManager();
  const canManage = isOwner || isManager;

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [protocols, setProtocols] = useState<ProtocolListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [targetVideos, setTargetVideos] = useState('5');

  const fetchProtocols = useCallback(async () => {
    setLoading(true);
    const res = await api.get<ProtocolListItem[]>(
      `${apiEndpoints.protocols}?month=${currentMonth}&year=${currentYear}`
    );
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      setProtocols(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  }, [currentMonth, currentYear]);

  useEffect(() => { fetchProtocols(); }, [fetchProtocols]);

  const fetchClients = async () => {
    const res = await api.get<any[]>(apiEndpoints.clients);
    if (res.data) setClients(Array.isArray(res.data) ? res.data : []);
  };

  const handleCreate = async () => {
    if (!selectedClient) { toast.error('Select a client'); return; }
    setCreating(true);
    const res = await api.post(apiEndpoints.protocols, {
      client: Number(selectedClient),
      month: currentMonth,
      year: currentYear,
      target_videos: Number(targetVideos) || 5,
    });
    setCreating(false);
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      toast.success('Protocol created');
      setShowCreate(false);
      setSelectedClient('');
      setTargetVideos('5');
      fetchProtocols();
    }
  };

  const navigateMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-green-500';
    if (pct >= 60) return 'bg-cyan-500';
    if (pct >= 30) return 'bg-yellow-500';
    return 'bg-slate-500';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Video className="h-7 w-7 text-cyan-400" />
            Video Protocol
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monthly video production workflow management</p>
        </div>
        {canManage && (
          <Button
            onClick={() => { setShowCreate(true); fetchClients(); }}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Protocol
          </Button>
        )}
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)} className="text-slate-400 hover:text-white">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">{MONTHS[currentMonth - 1]} {currentYear}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)} className="text-slate-400 hover:text-white">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Create Protocol Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-white">Create Monthly Protocol</h3>
            <div className="space-y-2">
              <Label className="text-slate-200">Client</Label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white"
              >
                <option value="" className="bg-slate-900">Select client...</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.numeric_id || c.id} className="bg-slate-900">{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Target Videos</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={targetVideos}
                onChange={(e) => setTargetVideos(e.target.value)}
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating} className="bg-cyan-500 hover:bg-cyan-600">
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Protocol List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : protocols.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-white/10">
          <Video className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No protocols for {MONTHS[currentMonth - 1]} {currentYear}</p>
          {canManage && (
            <Button
              onClick={() => { setShowCreate(true); fetchClients(); }}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Protocol
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {protocols.map((p) => {
            const posted = p.video_status_counts?.posted || 0;
            const inProg = p.video_status_counts?.in_progress || 0;
            const notStarted = p.video_status_counts?.not_started || 0;
            const total = p.total_videos || p.target_videos;

            return (
              <div
                key={p.id}
                onClick={() => router.push(`/adminzenfix/video-protocol/${p.id}`)}
                className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {p.client_name?.[0]}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{p.client_name}</h3>
                        <p className="text-slate-400 text-xs">
                          {MONTHS[p.month - 1]} {p.year} &middot; {p.target_videos} target videos
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div className="text-center p-2 bg-green-500/10 rounded-lg">
                        <p className="text-lg font-bold text-green-400">{posted}</p>
                        <p className="text-[10px] text-slate-400">Posted</p>
                      </div>
                      <div className="text-center p-2 bg-cyan-500/10 rounded-lg">
                        <p className="text-lg font-bold text-cyan-400">{inProg}</p>
                        <p className="text-[10px] text-slate-400">In Progress</p>
                      </div>
                      <div className="text-center p-2 bg-slate-500/10 rounded-lg">
                        <p className="text-lg font-bold text-slate-400">{notStarted}</p>
                        <p className="text-[10px] text-slate-400">Not Started</p>
                      </div>
                      <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                        <p className="text-lg font-bold text-purple-400">{p.fully_completed_videos || 0}</p>
                        <p className="text-[10px] text-slate-400">Fully Done</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Workflow Progress</span>
                        <span>{p.workflow_progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={cn("h-2 rounded-full transition-all", getProgressColor(p.workflow_progress || 0))}
                          style={{ width: `${Math.min(100, p.workflow_progress || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium",
                      p.status === 'active' ? 'bg-green-500/10 text-green-400' :
                      p.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-slate-500/10 text-slate-400'
                    )}>
                      {p.status}
                    </span>
                    <BarChart3 className="h-4 w-4 text-slate-600 mt-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
