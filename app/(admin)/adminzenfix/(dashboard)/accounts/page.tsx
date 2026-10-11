'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  ArrowLeft,
  Save,
  Loader2,
  MapPin,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, apiEndpoints } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useIsOwner, useIsManager, useClients, useUsers } from '@/lib/hooks';
import { cn } from '@/lib/utils';

const SPENDING_CATEGORIES = [
  'Travel',
  'Equipment',
  'Software',
  'Marketing',
  'Client Meeting',
  'Production',
  'Office Supplies',
  'Other',
];

export default function AccountsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = useIsOwner();
  const isManager = useIsManager();
  const canManage = isOwner || isManager;

  const { data: clients } = useClients();
  const { data: users } = useUsers();

  const [spendings, setSpendings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    client_id: '',
    employee_id: '',
    amount: '',
    description: '',
    category: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (!canManage) {
      router.replace('/adminzenfix/dashboard');
      return;
    }
    fetchSpendings();
    fetchStats();
  }, [canManage, router]);

  const fetchSpendings = async () => {
    try {
      const res = await api.get(`${apiEndpoints.spending}`);
      if (res.data) {
        setSpendings(res.data);
      }
    } catch (error) {
      console.error('Error fetching spendings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get(`${apiEndpoints.spending}/stats`);
      if (res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        client_id: Number(form.client_id),
        employee_id: Number(form.employee_id),
        amount: Number(form.amount),
        description: form.description,
        category: form.category,
        location: form.location,
        date: form.date,
        notes: form.notes,
      };

      const res = await api.post(apiEndpoints.spending, payload);

      if (res.error) {
        toast.error('Failed to add spending');
      } else {
        toast.success('Spending added successfully');
        setShowAddForm(false);
        setForm({
          client_id: '',
          employee_id: '',
          amount: '',
          description: '',
          category: '',
          location: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
        });
        fetchSpendings();
        fetchStats();
      }
    } catch (error) {
      console.error('Error adding spending:', error);
      toast.error('Failed to add spending');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSpendings = spendings.filter((spending: any) => {
    const matchesSearch =
      spending.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spending.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spending.employee_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || spending.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!canManage) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Accounts & Spending</h1>
          <p className="text-slate-400 mt-1">
            {isOwner ? 'Track all company spending across clients and employees' : 'Track your team spending'}
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Spending
        </Button>
      </div>

      {/* Stats Cards - Only for owners */}
      {isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Spending</p>
              <p className="text-2xl font-bold text-white mt-1">₹{stats?.total_spending?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">₹{stats?.by_status?.pending?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-400 mt-1">₹{stats?.by_status?.approved?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Entries</p>
              <p className="text-2xl font-bold text-white mt-1">{spendings.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Add Spending Form */}
      {showAddForm && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Add New Spending</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client */}
              <div className="space-y-2">
                <Label htmlFor="client_id" className="text-slate-200">
                  Client <span className="text-red-400">*</span>
                </Label>
                <select
                  id="client_id"
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ring-offset-slate-900"
                  required
                >
                  <option value="">Select a client</option>
                  {clients?.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee */}
              <div className="space-y-2">
                <Label htmlFor="employee_id" className="text-slate-200">
                  Employee <span className="text-red-400">*</span>
                </Label>
                <select
                  id="employee_id"
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ring-offset-slate-900"
                  required
                >
                  <option value="">Select an employee</option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-200">
                  Amount ($) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="bg-slate-800/50 border-white/10 text-white"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-200">
                  Category <span className="text-red-400">*</span>
                </Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ring-offset-slate-900"
                  required
                >
                  <option value="">Select category</option>
                  {SPENDING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-200">
                  Date <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="bg-slate-800/50 border-white/10 text-white"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-200 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Where was this spent?"
                  className="bg-slate-800/50 border-white/10 text-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-slate-200">
                  Description <span className="text-red-400">*</span>
                </Label>
                <textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what this spending was for..."
                  className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ring-offset-slate-900"
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes" className="text-slate-200">
                  Additional Notes
                </Label>
                <textarea
                  id="notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional details..."
                  className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ring-offset-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium px-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Spending
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search spendings..."
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Spendings Table */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-slate-400 font-medium text-sm">Date</th>
                  <th className="text-left p-4 text-slate-400 font-medium text-sm">Client</th>
                  <th className="text-left p-4 text-slate-400 font-medium text-sm">Employee</th>
                  <th className="text-left p-4 text-slate-400 font-medium text-sm">Description</th>
                  <th className="text-left p-4 text-slate-400 font-medium text-sm">Category</th>
                  <th className="text-left p-4 text-slate-400 font-medium text-sm">Location</th>
                  <th className="text-left p-4 text-slate-400 font-medium text-sm">Amount</th>
                  <th className="text-left p-4 text-slate-400 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpendings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No spendings found
                    </td>
                  </tr>
                ) : (
                  filteredSpendings.map((spending: any) => (
                    <tr key={spending.numeric_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <p className="text-white text-sm">{new Date(spending.date).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">{spending.client_name || 'N/A'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">{spending.employee_name || 'N/A'}</p>
                        <p className="text-slate-500 text-xs">{spending.employee_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">{spending.description}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">{spending.category}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">{spending.location || 'N/A'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-medium">₹{spending.amount.toFixed(2)}</p>
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium capitalize',
                            spending.status === 'approved'
                              ? 'bg-green-500/10 text-green-400'
                              : spending.status === 'rejected'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          )}
                        >
                          {spending.status}
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
  );
}
