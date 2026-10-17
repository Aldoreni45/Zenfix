'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit, Trash2, Save, X, Loader2, Mail, Phone,
  Building2, Video, User as UserIcon, Target, CheckCircle2, AlertTriangle,
  Ban, Receipt, TrendingUp, TrendingDown, Search, RefreshCw, ArrowUpCircle, ArrowDownCircle, PhoneCall,
  Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useIsOwner, useIsManager } from '@/lib/hooks';
import { isValidPhone, restrictPhoneInput, PHONE_ERROR } from '@/lib/validation';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Month helpers for the transactions calendar (keys look like "2026-03").
const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatMonthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

// Compact money label for the month cards (e.g. ₹12,500).
const formatMoney = (amount: number) =>
  `₹${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`;

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = Number(params.id);
  const isOwner = useIsOwner();
  const isManagerRole = useIsManager();
  const canManage = isOwner || isManagerRole;

  const [client, setClient] = useState<any>(null);
  const [protocol, setProtocol] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Tabs: "Details" keeps the original client view, "Transactions" shows the
  // consolidated income/spending ledger for this client.
  const [activeTab, setActiveTab] = useState<'details' | 'transactions'>('details');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txMonth, setTxMonth] = useState<string>('all');
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'spending'>('all');
  const [txSearch, setTxSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    follow_up_number: '',
    monthly_video_target: '5',
    status: 'active',
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
        contact_person: clientRes.data.contact_person || '',
        email: clientRes.data.email || '',
        phone: clientRes.data.phone || '',
        follow_up_number: clientRes.data.follow_up_number || '',
        monthly_video_target: (clientRes.data.monthly_video_target || 5).toString(),
        status: clientRes.data.status || 'active',
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

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    setTxError(null);
    const res = await api.get<any>(apiEndpoints.clientTransactions(clientId));
    if (res.error) {
      setTxError(extractApiErrorMessage(res));
      setTransactions([]);
    } else {
      setTransactions(Array.isArray(res.data?.transactions) ? res.data.transactions : []);
    }
    setTxLoading(false);
  }, [clientId]);

  const handleTabChange = (tab: 'details' | 'transactions') => {
    setActiveTab(tab);
    if (tab === 'transactions') {
      fetchTransactions();
    }
  };

  // Open the edit form automatically when navigated from the list's Edit action.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = new URLSearchParams(window.location.search);
    if (search.get('edit') === '1') {
      setEditing(true);
    }
  }, []);

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Client name is required');
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      toast.error(PHONE_ERROR);
      return;
    }
    if (form.follow_up_number.trim() && !isValidPhone(form.follow_up_number)) {
      toast.error(PHONE_ERROR);
      return;
    }
    setSaving(true);
    const payload: Record<string, any> = {
      name: form.name.trim(),
      contact_person: form.contact_person.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      follow_up_number: form.follow_up_number.trim(),
      monthly_video_target: Number(form.monthly_video_target) || 5,
    };
    // Only the owner may block/activate a client (same rule as users), so
    // other roles never send a status field.
    if (isOwner) payload.status = form.status;

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

  const handleToggleStatus = async () => {
    if (!isOwner || !client) return;
    
    setUpdatingStatus(true);
    try {
      const newStatus = client.status === 'active' ? 'inactive' : 'active';
      const res = await api.patch(apiEndpoints.client(clientId), { status: newStatus });
      
      if (res.error) {
        toast.error(extractApiErrorMessage(res));
      } else {
        toast.success(`Client ${newStatus === 'active' ? 'activated' : 'blocked'} successfully`);
        await fetchClient();
      }
    } catch (err) {
      toast.error('Failed to update client status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Client ledger helpers -------------------------------------------------
  // Every month from the oldest transaction up to the current month, newest first.
  const monthOptions = useMemo(() => {
    const now = new Date();
    const currentKey = toMonthKey(now);
    let earliestKey = currentKey;

    transactions.forEach((tx: any) => {
      if (!tx.date) return;
      const key = toMonthKey(new Date(tx.date));
      if (key < earliestKey) earliestKey = key;
    });

    const [ey, em] = earliestKey.split('-').map(Number);
    const end = new Date(ey, em - 1, 1);
    const options: { value: string; label: string }[] = [];
    let cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    while (cursor >= end) {
      const key = toMonthKey(cursor);
      options.push({ value: key, label: formatMonthLabel(key) });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    }
    return options;
  }, [transactions]);

  // Per-month totals for the history grid (newest first — every month is shown).
  const monthHistory = useMemo(
    () =>
      monthOptions.map(({ value, label }) => {
        const items = transactions.filter(
          (tx: any) => tx.date && toMonthKey(new Date(tx.date)) === value
        );
        const income = items
          .filter((tx: any) => tx.type === 'income')
          .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
        const spending = items
          .filter((tx: any) => tx.type === 'spending')
          .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
        return {
          value,
          label,
          income,
          spending,
          net: income - spending,
          count: items.length,
        };
      }),
    [monthOptions, transactions]
  );

  const monthIndex = monthOptions.findIndex((m) => m.value === txMonth);
  const canGoOlder = txMonth !== 'all' && monthIndex >= 0 && monthIndex < monthOptions.length - 1;
  const canGoNewer = txMonth !== 'all' && monthIndex > 0;
  const goOlderMonth = () => {
    if (canGoOlder) setTxMonth(monthOptions[monthIndex + 1].value);
  };
  const goNewerMonth = () => {
    if (canGoNewer) setTxMonth(monthOptions[monthIndex - 1].value);
  };

  // Transactions inside the selected month (everything when "all").
  const monthTransactions =
    txMonth === 'all'
      ? transactions
      : transactions.filter((tx: any) => tx.date && toMonthKey(new Date(tx.date)) === txMonth);

  // Summary recalculated for the selected period so the cards always match the table.
  const periodIncome = monthTransactions
    .filter((tx: any) => tx.type === 'income')
    .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
  const periodSpending = monthTransactions
    .filter((tx: any) => tx.type === 'spending')
    .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
  const txPeriodSummary = {
    total_income: periodIncome,
    total_spending: periodSpending,
    net: periodIncome - periodSpending,
    transaction_count: monthTransactions.length,
  };

  const filteredTransactions = monthTransactions.filter((tx) => {
    const matchesType = txFilter === 'all' || tx.type === txFilter;
    if (!matchesType) return false;
    if (!txSearch.trim()) return true;
    const q = txSearch.toLowerCase();
    return (
      (tx.description || '').toLowerCase().includes(q) ||
      (tx.category || '').toLowerCase().includes(q) ||
      (tx.party_name || '').toLowerCase().includes(q)
    );
  });

  const txStatusStyle = (tx: any) => {
    if (tx.type === 'income') {
      return tx.status === 'received' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400';
    }
    if (tx.status === 'approved') return 'bg-green-500/10 text-green-400';
    if (tx.status === 'rejected') return 'bg-red-500/10 text-red-400';
    return 'bg-yellow-500/10 text-yellow-400';
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
              <p className="text-slate-400 text-sm">{client.contact_person || 'No owner'}</p>
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleStatus}
                  disabled={updatingStatus}
                  className={cn(
                    client.status === 'active' ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' : 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                  )}
                >
                  {updatingStatus ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : client.status === 'active' ? (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      Block
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </Button>
                <Button onClick={handleDelete} disabled={deleting} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      {canManage && (
        <div className="flex gap-2 border-b border-white/10 pb-4">
          {[
            { id: 'details' as const, label: 'Details', icon: Building2 },
            { id: 'transactions' as const, label: 'Transactions', icon: Receipt },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Monthly Protocol Widget */}
      {activeTab === 'details' && protocol && (
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
      {activeTab === 'details' && (
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
          {/* Brand Name */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              Brand Name <span className="text-red-400">*</span>
            </Label>
            {editing ? (
              <Input value={form.name} onChange={(e) => setField('name', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.name}</p>
            )}
          </div>

          {/* Brand Owner */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-slate-400" /> Brand Owner
            </Label>
            {editing ? (
              <Input value={form.contact_person} onChange={(e) => setField('contact_person', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.contact_person || '—'}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> Email
            </Label>
            {editing ? (
              <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.email || '—'}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone Number
            </Label>
            {editing ? (
              <Input value={form.phone} onChange={(e) => setField('phone', restrictPhoneInput(e.target.value))} inputMode="numeric" maxLength={10} placeholder="10-digit number" className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500" />
            ) : (
              <p className="text-white">{client.phone || '—'}</p>
            )}
          </div>

          {/* Follow-up Number */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-slate-400" /> Follow-up Number
            </Label>
            {editing ? (
              <Input value={form.follow_up_number} onChange={(e) => setField('follow_up_number', restrictPhoneInput(e.target.value))} inputMode="numeric" maxLength={10} placeholder="10-digit number" className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500" />
            ) : (
              <p className="text-white">{client.follow_up_number || '—'}</p>
            )}
          </div>

          {/* Monthly Video Target */}
          <div className="space-y-2">
            <Label className="text-slate-200 flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-slate-400" /> Monthly Target
            </Label>
            {editing ? (
              <Input type="number" min={1} max={100} value={form.monthly_video_target} onChange={(e) => setField('monthly_video_target', e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            ) : (
              <p className="text-white">{client.monthly_video_target || 5} videos/month</p>
            )}
          </div>

          {/* Status (owner-only: block/activate lives on the header button) */}
          <div className="space-y-2">
            <Label className="text-slate-200">Status</Label>
            {editing && isOwner ? (
              <select value={form.status} onChange={(e) => setField('status', e.target.value)} className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white capitalize">
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
                ))}
              </select>
            ) : (
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium capitalize inline-block',
                client.status === 'active' ? 'bg-green-500/10 text-green-400' :
                'bg-slate-500/10 text-slate-400'
              )}>
                {client.status}
              </span>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Income</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    ₹{txPeriodSummary.total_income.toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <ArrowDownCircle className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Spending</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    ₹{txPeriodSummary.total_spending.toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <ArrowUpCircle className="h-5 w-5 text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Net Balance</p>
                  <p className={cn('text-2xl font-bold mt-1', txPeriodSummary.net >= 0 ? 'text-green-400' : 'text-red-400')}>
                    ₹{txPeriodSummary.net.toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  {txPeriodSummary.net >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-cyan-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Transactions</p>
                  <p className="text-2xl font-bold text-white mt-1">{txPeriodSummary.transaction_count}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Error state */}
          {txError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
              <p className="text-red-400 text-sm">{txError}</p>
              <Button variant="outline" size="sm" onClick={fetchTransactions} className="border-red-500/30 text-red-400">
                Retry
              </Button>
            </div>
          )}

          {/* Monthly history — every month is listed so you can track history */}
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Monthly history</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goOlderMonth}
                  disabled={!canGoOlder}
                  title="Previous month"
                  className="h-8 w-8 p-0 border-white/10 text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goNewerMonth}
                  disabled={!canGoNewer}
                  title="Next month"
                  className="h-8 w-8 p-0 border-white/10 text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setTxMonth('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  txMonth === 'all'
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    : 'bg-white/5 text-gray-400 hover:text-white border-transparent'
                )}
              >
                All time
              </button>

              <span className="text-xs text-slate-400 sm:ml-auto">
                Showing {txMonth === 'all' ? 'all time' : formatMonthLabel(txMonth)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
              {monthHistory.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setTxMonth(m.value)}
                  title={`${m.count} transaction${m.count === 1 ? '' : 's'}`}
                  className={cn(
                    'text-left rounded-lg border p-3 transition-colors',
                    txMonth === m.value
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white truncate">{m.label}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{m.count}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Income</span>
                      <span className="text-green-400 font-medium">{formatMoney(m.income)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Spending</span>
                      <span className="text-red-400 font-medium">{formatMoney(m.spending)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-1">
                      <span className="text-slate-400">Net</span>
                      <span className={cn('font-semibold', m.net >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {formatMoney(m.net)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by description, category or employee..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-2">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'income' as const, label: 'Income' },
                { id: 'spending' as const, label: 'Spending' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTxFilter(f.id)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    txFilter === f.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                  )}
                >
                  {f.label}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTransactions}
                disabled={txLoading}
                title="Refresh transactions"
                className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 h-10"
              >
                <RefreshCw className={cn('h-4 w-4', txLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
            {txLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Date</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Type</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Category</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Description</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Employee / Method</th>
                      <th className="text-right p-4 text-slate-400 font-medium text-sm">Amount</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          {txMonth === 'all'
                            ? 'No transactions found for this client'
                            : `No transactions found in ${formatMonthLabel(txMonth)}`}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx: any) => (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white text-sm whitespace-nowrap">
                            {tx.date ? new Date(tx.date).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                                tx.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                              )}
                            >
                              {tx.type === 'income' ? (
                                <ArrowDownCircle className="h-3 w-3" />
                              ) : (
                                <ArrowUpCircle className="h-3 w-3" />
                              )}
                              {tx.type === 'income' ? 'Income' : 'Spending'}
                            </span>
                          </td>
                          <td className="p-4 text-white text-sm">{tx.category}</td>
                          <td className="p-4 text-slate-300 text-sm">{tx.description || '—'}</td>
                          <td className="p-4 text-slate-300 text-sm">{tx.party_name || '—'}</td>
                          <td
                            className={cn(
                              'p-4 text-sm font-medium text-right whitespace-nowrap',
                              tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                            )}
                          >
                            {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount || 0).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', txStatusStyle(tx))}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
