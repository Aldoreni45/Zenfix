'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Video, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVideos, useCanManage } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export default function VideosPage() {
  const { data: videos, loading, error, refetch } = useVideos();
  const canManage = useCanManage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'bg-slate-500/10 text-slate-400',
      assigned: 'bg-blue-500/10 text-blue-400',
      in_progress: 'bg-cyan-500/10 text-cyan-400',
      shooting: 'bg-purple-500/10 text-purple-400',
      shot_completed: 'bg-indigo-500/10 text-indigo-400',
      editing: 'bg-pink-500/10 text-pink-400',
      editing_completed: 'bg-rose-500/10 text-rose-400',
      owner_review: 'bg-amber-500/10 text-amber-400',
      owner_rejected: 'bg-red-500/10 text-red-400',
      client_review: 'bg-yellow-500/10 text-yellow-400',
      client_rejected: 'bg-red-500/10 text-red-400',
      approved: 'bg-green-500/10 text-green-400',
      scheduled: 'bg-teal-500/10 text-teal-400',
      posted: 'bg-emerald-500/10 text-emerald-400',
      cancelled: 'bg-gray-500/10 text-gray-400',
    };
    return colors[status] || colors.planned;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      low: 'bg-green-500/10 text-green-400 border-green-500/20',
    };
    return colors[priority] || colors.medium;
  };

  const getWorkflowStage = (status: string) => {
    const stages: Record<string, string> = {
      planned: 'Planning',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      shooting: 'Shooting',
      shot_completed: 'Shot Complete',
      editing: 'Editing',
      editing_completed: 'Edit Complete',
      owner_review: 'Owner Review',
      owner_rejected: 'Owner Rejected',
      client_review: 'Client Review',
      client_rejected: 'Client Rejected',
      approved: 'Approved',
      scheduled: 'Scheduled',
      posted: 'Posted',
      cancelled: 'Cancelled',
    };
    return stages[status] || status;
  };

  const filteredVideos = videos?.filter((video: any) => {
    const matchesSearch = 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.video_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.client_name && video.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const workflowStages = [
    { id: 'all', label: 'All Videos', count: videos?.length || 0 },
    { id: 'in_production', label: 'In Production', count: videos?.filter((v: any) => ['in_progress', 'shooting', 'editing'].includes(v.status)).length || 0 },
    { id: 'waiting_approval', label: 'Waiting Approval', count: videos?.filter((v: any) => ['owner_review', 'client_review'].includes(v.status)).length || 0 },
    { id: 'approved', label: 'Approved', count: videos?.filter((v: any) => v.status === 'approved').length || 0 },
    { id: 'posted', label: 'Posted', count: videos?.filter((v: any) => v.status === 'posted').length || 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading videos…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Videos</h1>
          <p className="text-slate-400 mt-1">Manage video production workflow and approvals</p>
        </div>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {workflowStages.map((stage) => (
          <div
            key={stage.id}
            onClick={() => setActiveTab(stage.id)}
            className={cn(
              'bg-slate-900/50 border border-white/10 rounded-xl p-4 cursor-pointer transition-all hover:border-white/20',
              activeTab === stage.id && 'border-cyan-500/30 bg-cyan-500/5'
            )}
          >
            <p className="text-2xl font-bold text-white">{stage.count}</p>
            <p className="text-slate-400 text-sm mt-1">{stage.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search videos..."
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
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="shooting">Shooting</option>
          <option value="editing">Editing</option>
          <option value="owner_review">Owner Review</option>
          <option value="client_review">Client Review</option>
          <option value="approved">Approved</option>
          <option value="posted">Posted</option>
        </select>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVideos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-500">No videos found</p>
          </div>
        ) : (
          filteredVideos.map((video: any) => (
            <Link
              key={video.id}
              href={`/adminzenfix/videos/${video.id}`}
              className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group"
            >
              {/* Video Thumbnail Placeholder */}
              <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                <Video className="h-12 w-12 text-slate-600" />
                {video.is_overdue && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                    Overdue
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white">
                  {video.video_code}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1 group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="text-slate-500 text-sm">{video.client_name || 'No client'}</p>
                  </div>
                  <span className={cn('px-2 py-1 rounded text-xs font-medium border capitalize', getPriorityColor(video.priority))}>
                    {video.priority_name}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Play className="h-4 w-4" />
                    <span>{getWorkflowStage(video.status)}</span>
                  </div>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', getStatusColor(video.status))}>
                    {video.status_name}
                  </span>
                </div>

                {/* Assignment Info */}
                <div className="space-y-2 text-xs">
                  {video.shooter_name && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Shooter:</span>
                      <span className="text-white">{video.shooter_name}</span>
                    </div>
                  )}
                  {video.editor_name && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Editor:</span>
                      <span className="text-white">{video.editor_name}</span>
                    </div>
                  )}
                  {video.shoot_date && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Shoot Date:</span>
                      <span className="text-white">{new Date(video.shoot_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-white font-medium">
                      {video.status === 'posted' ? '100%' : 
                       video.status === 'approved' ? '90%' :
                       video.status === 'editing' ? '50%' :
                       video.status === 'shooting' ? '25%' : '10%'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        video.status === 'posted' ? 'bg-green-500' :
                        video.status === 'approved' ? 'bg-emerald-500' :
                        video.status === 'editing' ? 'bg-pink-500' :
                        video.status === 'shooting' ? 'bg-purple-500' :
                        'bg-cyan-500'
                      )}
                      style={{ 
                        width: video.status === 'posted' ? '100%' : 
                               video.status === 'approved' ? '90%' :
                               video.status === 'editing' ? '50%' :
                               video.status === 'shooting' ? '25%' : '10%'
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  );
}