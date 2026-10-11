'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DollarSign,
  Plus,
  Search,
  TrendingUp,
  Users,
  Calendar,
  Save,
  Loader2,
  MapPin,
  FileText,
  Wallet,
  ArrowUpCircle,
  CheckCircle,
  Clock,
  Receipt,
  Calculator,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, apiEndpoints } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useIsOwner, useIsManager, useClients, useUsers } from '@/lib/hooks';
import { cn } from '@/lib/utils';

const SPENDING_CATEGORIES = [
  'Travel', 'Equipment', 'Software', 'Marketing', 'Client Meeting', 'Production', 'Office Supplies', 'Other',
];

const INCOME_CATEGORIES = [
  'Video Production', 'Monthly Retainer', 'Project Fee', 'Consulting', 'Other',
];

type TabType = 'spending' | 'payments' | 'income' | 'salary' | 'tally';

export default function AccountsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = useIsOwner();
  const isManager = useIsManager();
  const canManage = isOwner || isManager;

  const { data: clients } = useClients();
  const { data: users } = useUsers();

  const [activeTab, setActiveTab] = useState<TabType>('spending');
  const [spendings, setSpendings] = useState<any[]>([]);
  const [spendingStats, setSpendingStats] = useState<any>(null);
  const [employeePayments, setEmployeePayments] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [tally, setTally] = useState<any>(null);
  const [tallyMonth, setTallyMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [incomeMonth, setIncomeMonth] = useState('all'); // 'all' or YYYY-MM
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [paymentConfirm, setPaymentConfirm] = useState<any>(null);

  const [form, setForm] = useState({
    client_id: '', employee_id: '', amount: '', description: '', category: '', location: '',
    date: new Date().toISOString().split('T')[0], notes: '', total_spending: '', amount_paid: '', month: new Date().toISOString().slice(0, 7),
  });

  useEffect(() => {
    if (!canManage) {
      router.replace('/adminzenfix/dashboard');
      return;
    }
    fetchData();
  }, [canManage, router, activeTab, tallyMonth, incomeMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'spending') {
        const [spendingsRes, statsRes] = await Promise.all([
          api.get(apiEndpoints.spending),
          api.get(apiEndpoints.spendingStats),
        ]);
        if (spendingsRes.data && Array.isArray(spendingsRes.data)) setSpendings(spendingsRes.data);
        else setSpendings([]);
        if (statsRes.data) setSpendingStats(statsRes.data);
      } else if (activeTab === 'payments') {
        const res = await api.get(apiEndpoints.employeePaymentSummary);
        if (res.data && Array.isArray(res.data)) setEmployeePayments(res.data);
        else setEmployeePayments([]);
      } else if (activeTab === 'income') {
        const res = await api.get(apiEndpoints.income);
        if (res.data && Array.isArray(res.data)) {
          const filtered = incomeMonth === 'all' 
            ? res.data 
            : res.data.filter((item: any) => item.income_date?.startsWith(incomeMonth));
          setIncome(filtered);
        } else setIncome([]);
      } else if (activeTab === 'salary') {
        const res = await api.get(apiEndpoints.salary);
        if (res.data && Array.isArray(res.data)) setSalaries(res.data);
        else setSalaries([]);
      } else if (activeTab === 'tally') {
        const res = await api.get(`${apiEndpoints.tally}?month=${tallyMonth}`);
        if (res.data) setTally(res.data);
        else setTally(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (activeTab === 'spending') {
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
        if (res.error) toast.error('Failed to add spending');
        else {
          toast.success('Spending added successfully');
          fetchData();
        }
      } else if (activeTab === 'payments') {
        const payload = {
          employee_id: Number(form.employee_id),
          total_spending: Number(form.total_spending),
          amount_paid: Number(form.amount_paid),
          notes: form.notes,
        };
        const res = await api.post(apiEndpoints.employeePayments, payload);
        if (res.error) toast.error('Failed to add payment');
        else {
          toast.success('Payment added successfully');
          fetchData();
        }
      } else if (activeTab === 'income') {
        const payload = {
          client_id: Number(form.client_id),
          amount: Number(form.amount),
          description: form.description,
          category: form.category,
          income_date: form.date,
          notes: form.notes,
        };
        const res = await api.post(apiEndpoints.income, payload);
        if (res.error) toast.error('Failed to add income');
        else {
          toast.success('Income added successfully');
          fetchData();
        }
      } else if (activeTab === 'salary') {
        const payload = {
          employee_id: Number(form.employee_id),
          amount: Number(form.amount),
          month: form.month,
          notes: form.notes,
        };
        const res = await api.post(apiEndpoints.salary, payload);
        if (res.error) toast.error(res.error || 'Failed to add salary');
        else {
          toast.success('Salary added successfully');
          fetchData();
        }
      }
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      client_id: '', employee_id: '', amount: '', description: '', category: '', location: '',
      date: new Date().toISOString().split('T')[0], notes: '', total_spending: '', amount_paid: '', month: new Date().toISOString().slice(0, 7),
    });
  };

  const handlePayEmployee = async (employeePayment: any) => {
    setPaymentConfirm(employeePayment);
  };

  const confirmPayment = async () => {
    if (!paymentConfirm) return;
    setSubmitting(true);

    try {
      // First, update spending status to approved for this employee
      await api.put(apiEndpoints.approveEmployeeSpending, {
        employee_id: paymentConfirm.employee_id,
      });

      if (!paymentConfirm.has_manual_payment) {
        const payload = {
          employee_id: paymentConfirm.employee_id,
          total_spending: paymentConfirm.total_spending,
          amount_paid: paymentConfirm.total_spending,
          status: 'completed',
          payment_date: new Date().toISOString(),
          notes: 'Paid from spending summary',
        };
        const res = await api.post(apiEndpoints.employeePayments, payload);
        if (res.error) toast.error('Failed to record payment');
        else toast.success('Payment recorded successfully');
      } else {
        const res = await api.put(apiEndpoints.employeePaymentItem(paymentConfirm.manual_payment_id), {
          amount_paid: paymentConfirm.total_spending,
          status: 'completed',
          payment_date: new Date().toISOString(),
        });
        if (res.error) toast.error('Failed to update payment');
        else toast.success('Payment updated successfully');
      }
      fetchData();
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setSubmitting(false);
      setPaymentConfirm(null);
    }
  };

  const filteredData = () => {
    const data = activeTab === 'spending' ? spendings : activeTab === 'payments' ? employeePayments : activeTab === 'income' ? income : activeTab === 'salary' ? salaries : [];
    return data.filter((item: any) => {
      const matchesSearch =
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employee_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  if (!canManage) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Accounts</h1>
          <p className="text-slate-400 mt-1">Manage spending, payments, and income</p>
        </div>
        {isOwner && activeTab !== 'tally' && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === 'spending' ? 'Spending' : activeTab === 'payments' ? 'Payment' : activeTab === 'income' ? 'Income' : activeTab === 'salary' ? 'Salary' : 'Entry'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'spending' as TabType, label: 'Spending', icon: DollarSign },
          { id: 'payments' as TabType, label: 'Employee Payments', icon: Wallet },
          { id: 'income' as TabType, label: 'Income', icon: ArrowUpCircle },
          { id: 'salary' as TabType, label: 'Salary', icon: CreditCard, ownerOnly: true },
          { id: 'tally' as TabType, label: 'Tally', icon: Calculator, ownerOnly: true },
        ].filter(tab => !tab.ownerOnly || isOwner).map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setShowAddForm(false); }}
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

      {/* Stats Cards - Only for owners */}
      {isOwner && activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Owed</p>
                <p className="text-2xl font-bold text-red-400 mt-1">₹{employeePayments.reduce((sum, p) => sum + p.amount_pending, 0).toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Paid</p>
                <p className="text-2xl font-bold text-green-400 mt-1">₹{employeePayments.reduce((sum, p) => sum + p.amount_paid, 0).toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{employeePayments.filter(p => p.status === 'pending' || p.status === 'partial').length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      )}
      {isOwner && activeTab === 'spending' && spendingStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Spending</p>
                <p className="text-2xl font-bold text-white mt-1">₹{spendingStats.total_spending?.toFixed(2) || '0.00'}</p>
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
                <p className="text-2xl font-bold text-yellow-400 mt-1">₹{spendingStats.by_status?.pending?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Approved</p>
                <p className="text-2xl font-bold text-green-400 mt-1">₹{spendingStats.by_status?.approved?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
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

      {/* Add Form */}
      {showAddForm && isOwner && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              Add {activeTab === 'spending' ? 'Spending' : activeTab === 'payments' ? 'Payment' : 'Income'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTab === 'spending' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Client *</Label>
                    <select
                      value={form.client_id}
                      onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                      className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white"
                      required
                    >
                      <option value="">Select client</option>
                      {clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Employee *</Label>
                    <select
                      value={form.employee_id}
                      onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                      className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white"
                      required
                    >
                      <option value="">Select employee</option>
                      {users?.map((u: any) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Amount (₹) *</Label>
                    <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-slate-800/50 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Category *</Label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" required>
                      <option value="">Select category</option>
                      {SPENDING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Date *</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-slate-800/50 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Where was this spent?" className="bg-slate-800/50 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-200">Description *</Label>
                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this spending..." className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-200">Notes</Label>
                    <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional details..." className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" />
                  </div>
                </>
              )}
              {activeTab === 'payments' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Employee *</Label>
                    <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" required>
                      <option value="">Select employee</option>
                      {users?.map((u: any) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Total Spending (₹) *</Label>
                    <Input type="number" step="0.01" min="0" value={form.total_spending} onChange={(e) => setForm({ ...form, total_spending: e.target.value })} className="bg-slate-800/50 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Amount Paid (₹)</Label>
                    <Input type="number" step="0.01" min="0" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} className="bg-slate-800/50 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-200">Notes</Label>
                    <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Payment notes..." className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" />
                  </div>
                </>
              )}
              {activeTab === 'income' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Client *</Label>
                    <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" required>
                      <option value="">Select client</option>
                      {clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Amount (₹) *</Label>
                    <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-slate-800/50 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Category *</Label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" required>
                      <option value="">Select category</option>
                      {INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Date *</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-slate-800/50 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-200">Description *</Label>
                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this income..." className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-200">Notes</Label>
                    <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional details..." className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" />
                  </div>
                </>
              )}
              {activeTab === 'salary' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Employee *</Label>
                    <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" required>
                      <option value="">Select employee</option>
                      {users?.map((u: any) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Amount (₹) *</Label>
                    <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-slate-800/50 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Month *</Label>
                    <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="bg-slate-800/50 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-200">Notes</Label>
                    <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Salary notes..." className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white" />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium px-6">
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save</>}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        {activeTab !== 'tally' && (
          <>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            {activeTab === 'income' && (
              <select 
                value={incomeMonth} 
                onChange={(e) => setIncomeMonth(e.target.value)} 
                className="bg-slate-800/50 border border-white/10 text-white rounded-lg px-4 py-2"
              >
                <option value="all">All Time</option>
                <option value={new Date().toISOString().slice(0, 7)}>This Month</option>
                <option value={new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)}>Last Month</option>
              </select>
            )}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-800/50 border border-white/10 text-white rounded-lg px-4 py-2">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="received">Received</option>
              <option value="rejected">Rejected</option>
            </select>
          </>
        )}
        {activeTab === 'tally' && (
          <div className="flex items-center gap-4">
            <Label className="text-slate-200">Select Month:</Label>
            <Input
              type="month"
              value={tallyMonth}
              onChange={(e) => setTallyMonth(e.target.value)}
              className="bg-slate-800/50 border border-white/10 text-white w-40"
              min="2020-01"
              max="2030-12"
            />
          </div>
        )}
      </div>

      {/* Payment Confirmation Dialog */}
      {paymentConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Confirm Payment</h3>
            <p className="text-slate-400 mb-4">
              Are you sure you want to pay <span className="text-white font-medium">{paymentConfirm.employee_name}</span> the amount of <span className="text-green-400 font-bold">₹{paymentConfirm.amount_pending.toFixed(2)}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPaymentConfirm(null)}
                className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
              >
                No
              </Button>
              <Button
                onClick={confirmPayment}
                disabled={submitting}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Pay'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {activeTab === 'spending' && (
                    <>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Date</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Client</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Employee</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Description</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Category</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Amount</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Status</th>
                    </>
                  )}
                  {activeTab === 'payments' && (
                    <>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Employee</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Total Spending</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Amount Paid</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Pending</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Status</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Payment Date</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Actions</th>
                    </>
                  )}
                  {activeTab === 'income' && (
                    <>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Date</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Client</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Description</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Category</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Amount</th>
                    </>
                  )}
                  {activeTab === 'salary' && (
                    <>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Employee</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Month</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Amount</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Paid Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {activeTab === 'tally' ? (
                  tally ? (
                    <tr>
                      <td colSpan={6} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                            <p className="text-slate-400 text-sm mb-2">Total Spending</p>
                            <p className="text-3xl font-bold text-red-400">₹{tally.total_spending.toFixed(2)}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                            <p className="text-slate-400 text-sm mb-2">Total Salary</p>
                            <p className="text-3xl font-bold text-yellow-400">₹{tally.total_salary.toFixed(2)}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                            <p className="text-slate-400 text-sm mb-2">Net Profit</p>
                            <p className={cn('text-3xl font-bold', tally.profit >= 0 ? 'text-green-400' : 'text-red-400')}>₹{tally.profit.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-6 text-center">
                          <p className="text-slate-400">Profit Margin: <span className={cn('font-bold', Number(tally.profit_margin) >= 0 ? 'text-green-400' : 'text-red-400')}>{tally.profit_margin}%</span></p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">No tally data</td></tr>
                  )
                ) : filteredData().length === 0 ? (
                  <tr><td colSpan={activeTab === 'spending' ? 7 : activeTab === 'payments' ? 7 : activeTab === 'income' ? 5 : activeTab === 'salary' ? 4 : 6} className="p-8 text-center text-slate-500">No {activeTab} found</td></tr>
                ) : (
                  filteredData().map((item: any, index: number) => (
                    <tr key={item.numeric_id || index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      {activeTab === 'spending' && (
                        <>
                          <td className="p-4 text-white text-sm">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="p-4 text-white text-sm">{item.client_name || 'N/A'}</td>
                          <td className="p-4 text-white text-sm">{item.employee_name || 'N/A'}</td>
                          <td className="p-4 text-white text-sm">{item.description}</td>
                          <td className="p-4 text-white text-sm">{item.category}</td>
                          <td className="p-4 text-white font-medium">₹{item.amount.toFixed(2)}</td>
                          <td className="p-4"><span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', item.status === 'approved' ? 'bg-green-500/10 text-green-400' : item.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400')}>{item.status}</span></td>
                        </>
                      )}
                      {activeTab === 'payments' && (
                        <>
                          <td className="p-4 text-white text-sm">{item.employee_name || 'N/A'}</td>
                          <td className="p-4 text-white font-medium">₹{item.total_spending.toFixed(2)}</td>
                          <td className="p-4 text-green-400 font-medium">₹{item.amount_paid.toFixed(2)}</td>
                          <td className="p-4 text-yellow-400 font-medium">₹{item.amount_pending.toFixed(2)}</td>
                          <td className="p-4"><span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', item.status === 'completed' ? 'bg-green-500/10 text-green-400' : item.status === 'partial' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400')}>{item.status}</span></td>
                          <td className="p-4 text-slate-400 text-sm">{item.payment_date ? new Date(item.payment_date).toLocaleDateString() : '-'}</td>
                          <td className="p-4">
                            {item.amount_pending > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handlePayEmployee(item)}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs"
                              >
                                Pay
                              </Button>
                            )}
                            {item.amount_pending <= 0 && (
                              <span className="text-green-400 text-xs">Paid</span>
                            )}
                          </td>
                        </>
                      )}
                      {activeTab === 'income' && (
                        <>
                          <td className="p-4 text-white text-sm">{new Date(item.income_date).toLocaleDateString()}</td>
                          <td className="p-4 text-white text-sm">{item.client_name || 'N/A'}</td>
                          <td className="p-4 text-white text-sm">{item.description}</td>
                          <td className="p-4 text-white text-sm">{item.category}</td>
                          <td className="p-4 text-green-400 font-medium">₹{item.amount.toFixed(2)}</td>
                        </>
                      )}
                      {activeTab === 'salary' && (
                        <>
                          <td className="p-4 text-white text-sm">{item.employee_name || 'N/A'}</td>
                          <td className="p-4 text-white text-sm">{item.month}</td>
                          <td className="p-4 text-white font-medium">₹{item.amount.toFixed(2)}</td>
                          <td className="p-4 text-slate-400 text-sm">{item.paid_date ? new Date(item.paid_date).toLocaleDateString() : '-'}</td>
                        </>
                      )}
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
