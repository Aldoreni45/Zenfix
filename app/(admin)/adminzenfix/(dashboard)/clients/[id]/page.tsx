'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit, Trash2, Save, X, Loader2, Mail, Phone, Globe,
  Instagram, Building2, Calendar, UserCheck, Target, CheckCircle2,
  AlertTriangle, ExternalLink, Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useIsOwner, useIsManager, useManagers } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'lead', label: 'Lead' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = Number(params.id);
  const { user } = useAuth();
  const isOwner = useIsOwner();
  const isManagerRole = useIsManager();
  const canManage = isOwner || isManagerRole;

  const { data: managers, loading: managersLoading } = useManagers();

  const [client, setClient] = useState<any>(null);
  const [protocol, setProtocol] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    description: '',
    address: '',
    instagram_username: '',
    instagram_url: '',
    status: 'active',
    assigned_manager: '',
    start_date: '',
    end_date: '',
    monthly_video_target: '5',
    notes: '',
  });

  const fetchClient = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const [clientRes, protocolRes] = await Promise.all([
      api.get<any>(apiEndpoints.client(clientId)),
      api.get<any>(apiEndpoints.clientMonthlyProtocol(clientId)),
    ]);
    if (clientRes.error) {
      setFetchError(extractApiErrorMessage(clientRes));
    } else if (clientRes.data) {
      setClient(clientRes.data);
      setForm({
        name: clientRes.data.name || '',
        company_name: clientRes.data.company_name || '',
        contact_person: clientRes.data.contact_person || '',
        email: clientRes.data.email || '',
        phone: clientRes.data.phone || '',
        website: clientRes.data.website || '',
        industry: clientRes.data.industry || '',
        description: clientRes.data.description || '',
        address: clientRes.data.address || '',
        instagram_username: clientRes.data.instagram_username || '',
        instagram_url: clientRes.data.instagram_url || '',
        status: clientRes.data.status || 'active',
        assigned_manager: clientRes.data.assigned_manager?.toString() || '',
        start_date: clientRes.data.start_date || '',
        end_date: clientRes.data.end_date || '',
        monthly_video_target: (clientRes.data.monthly_video_target || 5).toString(),
        notes: clientRes.data.notes || '',
      });
    }
    if (protocolRes.data) {
      setProtocol(protocolRes.data);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Client name is required');
      return;
    }
    setSaving(true);
    const payload: Record<string, any> = {
      name: form.name.trim(),
      company_name: form.company_name.trim(),
      contact_person: form.contact_person.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      industry: form.industry.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      instagram_username: form.instagram_username.trim().replace(/^@+/, ''),
      status: form.status,
      notes: form.notes.trim(),
    };
    if (form.website.trim()) payload.website = form.website.trim();
    if (form.instagram_url.trim()) payload.instagram_url = form.instagram_url.trim();
    if (form.assigned_manager) payload.assigned_manager = Number(form.assigned_manager);
    if (form.start_date) payload.start_date = form.start_date;
    if (form.end_date) payload.end_date = form.end_date;
    payload.monthly_video_target = Number(form.monthly_video_target) || 5;

    const res = await api.put(apiEndpoints.client(clientId), payload);
    setSaving(false);
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      toast.success('Client updated successfully');
      setEditing(false);
      await fetchClient();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) return;
    setDeleting(true);
    const res = await api.delete(apiEndpoints.client(clientId));
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
      setDeleting(false);
    } else {
      toast.success('Client deleted');
      router.push('/adminzenfix/clients');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-slate-400 text-center max-w-sm">{fetchError}</p>
        <Button onClick={fetchClient} className="bg-cyan-500 hover:bg-cyan-600">Retry</Button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Client not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/adminzenfix/clients">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {client.name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{client.name}</h1>
              <p className="text-slate-400 text-sm">{client.company_name || 'No company'}</p>
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            {!editing && (
              <Button onClick={() => setEditing(true)} variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {isOwner && (
              <Button onClick={handleDelete} disabled={deleting} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Monthly Protocol Widget */}
      {protocol && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-cyan-400" />
            Monthly Video Protocol
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-white/5">
              <p className="text-3xl font-bold text-white">{protocol.posted_videos}</p>
              <p className="text-xs text-slate-400 mt-1">Videos Posted</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-white/5">
              <p className="text-3xl font-bold text-cyan-400">{protocol.total_required}</p>
              <p className="text-xs text-slate-400 mt-1">Monthly Target</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-white/5">
              <p className={cn("text-3xl font-bold", protocol.remaining > 0 ? "text-yellow-400" : "text-green-400")}>
                {protocol.remaining}
              </p>
              <p className="text-xs text-slate-400 mt-1">Remaining</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-white/5">
              <p className="text-3xl font-bold text-purple-400">{protocol.completed_months}</p>
              <p className="text-xs text-slate-400 mt-1">Months Completed</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{protocol.month}/{protocol.year} Progress</span>
              <span>{Math.min(100, Math.round((protocol.posted_videos / protocol.total_required) * 100))}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={cn("h-3 rounded-full transition-all", protocol.is_month_complete ? "bg-green-500" : "bg-cyan-500")}
                style={{ width: `${Math.min(100, (protocol.posted_videos / protocol.total_required) * 100)}%` }}
              />
            </div>
            {protocol.is_month_complete && (
              <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Monthly target achieved! Ready for next cycle.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Client Details / Edit Form */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="border-b border-white/10 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-400" />
            Client Details
          </h2>
          {editing && (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm" className="bg-green-500 hover:bg-green-600">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
              <Button onClick={() => { setEditing(false); fetchClient(); }} size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-slate-200">Client / Brand Name</Label>
            {editing ? (
              <Input value={form.name} onChange={(e) => setField('name', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.name}</p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label className="text-slate-200">Company Name</Label>
            {editing ? (
              <Input value={form.company_name} onChange={(e) => setField('company_name', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.company_name || '—'}</p>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-slate-400" /> Contact Person</Label>
            {editing ? (
              <Input value={form.contact_person} onChange={(e) => setField('contact_person', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.contact_person || '—'}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> Email</Label>
            {editing ? (
              <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.email || '—'}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> Phone</Label>
            {editing ? (
              <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.phone || '—'}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-slate-400" /> Website</Label>
            {editing ? (
              <Input value={form.website} onChange={(e) => setField('website', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              client.website ? (
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1 text-sm">
                  {client.website} <ExternalLink className="h-3 w-3" />
                </a>
              ) : <p className="text-white">—</p>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label className="text-slate-200">Industry</Label>
            {editing ? (
              <Input value={form.industry} onChange={(e) => setField('industry', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.industry || '—'}</p>
            )}
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5 text-pink-400" /> Instagram</Label>
            {editing ? (
              <Input value={form.instagram_username} onChange={(e) => setField('instagram_username', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              client.instagram_username ? (
                <a href={client.instagram_url || `https://instagram.com/${client.instagram_username}`} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline flex items-center gap-1 text-sm">
                  @{client.instagram_username} <ExternalLink className="h-3 w-3" />
                </a>
              ) : <p className="text-white">—</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-slate-200">Status</Label>
            {editing ? (
              <select value={form.status} onChange={(e) => setField('status', e.target.value)} className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white capitalize">
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
                ))}
              </select>
            ) : (
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium capitalize inline-block',
                client.status === 'active' ? 'bg-green-500/10 text-green-400' :
                client.status === 'inactive' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-slate-500/10 text-slate-400'
              )}>
                {client.status}
              </span>
            )}
          </div>

          {/* Manager */}
          <div className="space-y-2">
            <Label className="text-slate-200">Assigned Manager</Label>
            {editing ? (
              <select value={form.assigned_manager} onChange={(e) => setField('assigned_manager', e.target.value)} className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white">
                <option value="" className="bg-slate-900 text-slate-400">Unassigned</option>
                {(managers || []).map((m: any) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">{m.full_name || m.username}</option>
                ))}
              </select>
            ) : (
              <p className="text-white">{client.manager_name || 'Unassigned'}</p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Start Date</Label>
            {editing ? (
              <Input type="date" value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.start_date || '—'}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /> End Date</Label>
            {editing ? (
              <Input type="date" value={form.end_date} onChange={(e) => setField('end_date', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.end_date || '—'}</p>
            )}
          </div>

          {/* Monthly Video Target */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5"><Video className="h-3.5 w-3.5 text-slate-400" /> Monthly Video Target</Label>
            {editing ? (
              <Input type="number" min={1} max={100} value={form.monthly_video_target} onChange={(e) => setField('monthly_video_target', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.monthly_video_target || 5} videos/month</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-200">Description</Label>
            {editing ? (
              <textarea rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" />
            ) : (
              <p className="text-white whitespace-pre-wrap">{client.description || '—'}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-200">Notes</Label>
            {editing ? (
              <textarea rows={3} value={form.notes} onChange={(e) => setField('notes', e.target.value)} className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" />
            ) : (
              <p className="text-white whitespace-pre-wrap">{client.notes || '—'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
