'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  Loader2,
  Users,
  Tag,
  Building2,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useIsOwner } from '@/lib/hooks';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatINR(value: number | null | undefined): string {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export interface BreakdownRow {
  label: string;
  amount: number;
  count?: number;
}

interface SpendingState {
  total: number;
  byClient: BreakdownRow[];
  byCategory: BreakdownRow[];
  byEmployee: BreakdownRow[];
  byStatus: { pending: number; approved: number; rejected: number };
}

interface IncomeState {
  total: number;
  byCategory: BreakdownRow[];
}

interface PayrollState {
  total: number;
  list: { name: string; amount: number; status?: string }[];
}

interface SpendingStatsResponse {
  total_spending?: number;
  spending_by_client?: { client_name?: string; total?: number }[];
  spending_by_employee?: { employee_name?: string; total?: number }[];
  breakdown?: { category?: string; amount?: number; count?: number }[];
  by_status?: { pending?: number; approved?: number; rejected?: number };
}

interface IncomeListItem {
  amount?: number;
  category?: string;
  source?: string;
}

interface SalaryListItem {
  employee_name?: string;
  amount?: number;
  status?: string;
}

/** Reusable, professional breakdown list with proportional bars and percentages. */
function BreakdownList({
  items,
  total,
  emptyText,
  barClass,
}: {
  items: BreakdownRow[];
  total: number;
  emptyText: string;
  barClass: string;
}) {
  if (!items.length) {
    return <p className="text-gray-400 text-sm py-2">{emptyText}</p>;
  }
  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const pct = total > 0 ? (item.amount / total) * 100 : 0;
        return (
          <div key={`${item.label}-${index}`} className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.label}</p>
                {typeof item.count === 'number' && (
                  <p className="text-xs text-gray-500">
                    {item.count} transaction{item.count === 1 ? '' : 's'}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-white text-sm font-semibold">{formatINR(item.amount)}</p>
                <p className="text-xs text-gray-500">{pct.toFixed(1)}%</p>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', barClass)}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BusinessIntelligencePage() {
  const isOwner = useIsOwner();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [spending, setSpending] = useState<SpendingState | null>(null);
  const [income, setIncome] = useState<IncomeState | null>(null);
  const [payroll, setPayroll] = useState<PayrollState | null>(null);

  const fetchFinancialData = async () => {
    if (!isOwner) return;

    setLoading(true);
    setError(null);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    try {
      const [spendingRes, incomeRes, salaryRes] = await Promise.all([
        api.get<SpendingStatsResponse>(`${apiEndpoints.spendingStats}?year=${year}&month=${month}`),
        api.get<IncomeListItem[]>(`${apiEndpoints.income}?year=${year}&month=${month}`),
        api.get<SalaryListItem[]>(`${apiEndpoints.salary}?year=${year}&month=${month}`),
      ]);

      // ---- Spending ----
      if (spendingRes.error) {
        setError(extractApiErrorMessage(spendingRes));
      } else {
        const raw = spendingRes.data;
        const byClient: BreakdownRow[] = (raw?.spending_by_client ?? [])
          .map((c) => ({ label: c.client_name || 'Unknown client', amount: Number(c.total) || 0 }))
          .sort((a, b) => b.amount - a.amount);

        const byCategory: BreakdownRow[] = (raw?.breakdown ?? [])
          .map((c) => ({
            label: c.category || 'Uncategorized',
            amount: Number(c.amount) || 0,
            count: Number(c.count) || 0,
          }))
          .sort((a, b) => b.amount - a.amount);

        const byEmployee: BreakdownRow[] = (raw?.spending_by_employee ?? [])
          .map((e) => ({ label: e.employee_name || 'Unassigned', amount: Number(e.total) || 0 }))
          .sort((a, b) => b.amount - a.amount);

        setSpending({
          total: Number(raw?.total_spending) || 0,
          byClient,
          byCategory,
          byEmployee,
          byStatus: {
            pending: Number(raw?.by_status?.pending) || 0,
            approved: Number(raw?.by_status?.approved) || 0,
            rejected: Number(raw?.by_status?.rejected) || 0,
          },
        });
      }

      // ---- Income ----
      if (incomeRes.error) {
        setError(extractApiErrorMessage(incomeRes));
      } else {
        // unwrapEnvelope returns the `data` array; total & breakdown are derived here.
        const incomeList = incomeRes.data ?? [];
        const total = incomeList.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

        const map = new Map<string, { amount: number; count: number }>();
        incomeList.forEach((inc) => {
          const key = inc.category || inc.source || 'Uncategorized';
          const entry = map.get(key) || { amount: 0, count: 0 };
          entry.amount += Number(inc.amount) || 0;
          entry.count += 1;
          map.set(key, entry);
        });
        const byCategory: BreakdownRow[] = [...map.entries()]
          .map(([label, data]) => ({ label, amount: data.amount, count: data.count }))
          .sort((a, b) => b.amount - a.amount);

        setIncome({ total, byCategory });
      }

      // ---- Payroll ----
      if (salaryRes.error) {
        setError(extractApiErrorMessage(salaryRes));
      } else {
        // unwrapEnvelope returns the `data` array; total is derived here.
        const salaryList = salaryRes.data ?? [];
        const total = salaryList.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

        setPayroll({
          total,
          list: salaryList
            .map((s) => ({
              name: s.employee_name || 'Employee',
              amount: Number(s.amount) || 0,
              status: s.status || 'paid',
            }))
            .sort((a, b) => b.amount - a.amount),
        });
      }
    } catch {
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, isOwner]);

  const totalSpending = spending?.total || 0;
  const totalIncome = income?.total || 0;
  const totalSalary = payroll?.total || 0;
  const profit = totalIncome - totalSpending - totalSalary;
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
  const transactionCount = spending?.byCategory.reduce((sum, c) => sum + (c.count || 0), 0) || 0;

  const goToMonth = (delta: number) =>
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Access denied. Business Intelligence is only available to owners.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Business Intelligence</h1>
          <p className="text-gray-400 mt-1">Financial overview and analytics</p>
        </div>
        <button
          onClick={fetchFinancialData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Month Selector */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-400" />
            <span className="text-white font-medium">Select Month</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToMonth(-1)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>
            <span className="text-white font-medium min-w-[180px] text-center">
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => goToMonth(1)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Wallet className="h-5 w-5 text-red-400" />
                </div>
                <span className="text-xs text-gray-400">Expenses</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatINR(totalSpending)}</p>
              <p className="text-sm text-gray-400 mt-1">Total Spending</p>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <ArrowUpRight className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-xs text-gray-400">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatINR(totalIncome)}</p>
              <p className="text-sm text-gray-400 mt-1">Total Income</p>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-xs text-gray-400">Payroll</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatINR(totalSalary)}</p>
              <p className="text-sm text-gray-400 mt-1">Total Salary Given</p>
            </div>

            <div
              className={cn(
                'bg-slate-900/50 border rounded-xl p-6',
                profit >= 0 ? 'border-green-500/20' : 'border-red-500/20'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={cn(
                    'p-2 rounded-lg border',
                    profit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                  )}
                >
                  <TrendingUp className={cn('h-5 w-5', profit >= 0 ? 'text-green-400' : 'text-red-400')} />
                </div>
                <span className="text-xs text-gray-400">
                  {totalIncome > 0 ? `${profitMargin.toFixed(1)}% margin` : 'Net'}
                </span>
              </div>
              <p className={cn('text-2xl font-bold', profit >= 0 ? 'text-green-400' : 'text-red-400')}>
                {formatINR(profit)}
              </p>
              <p className="text-sm text-gray-400 mt-1">Total Profit</p>
            </div>
          </div>

          {/* Monthly Spending Overview */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-red-400" />
                Monthly Spending Overview
              </h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{formatINR(totalSpending)}</p>
                <p className="text-xs text-gray-400">
                  {transactionCount} transaction{transactionCount === 1 ? '' : 's'} in {MONTH_NAMES[currentMonth.getMonth()]}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { label: 'Pending', value: spending?.byStatus.pending || 0, bar: 'bg-yellow-500', text: 'text-yellow-400' },
                { label: 'Approved', value: spending?.byStatus.approved || 0, bar: 'bg-green-500', text: 'text-green-400' },
                { label: 'Rejected', value: spending?.byStatus.rejected || 0, bar: 'bg-red-500', text: 'text-red-400' },
              ] as const).map((s) => {
                const pct = totalSpending > 0 ? (s.value / totalSpending) * 100 : 0;
                return (
                  <div key={s.label} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">{s.label}</span>
                      <span className={cn('text-sm font-semibold', s.text)}>{pct.toFixed(1)}%</span>
                    </div>
                    <p className="text-xl font-bold text-white mb-2">{formatINR(s.value)}</p>
                    <div className="w-full h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                      <div className={cn('h-full rounded-full', s.bar)} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spending by Client + Spending by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-cyan-400" />
                Spending by Client
              </h3>
              <BreakdownList
                items={spending?.byClient || []}
                total={totalSpending}
                emptyText="No client spending for this month"
                barClass="bg-cyan-500"
              />
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-400" />
                Spending by Category
              </h3>
              <BreakdownList
                items={spending?.byCategory || []}
                total={totalSpending}
                emptyText="No category spending for this month"
                barClass="bg-purple-500"
              />
            </div>
          </div>

          {/* Spending by Employee + Income by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Spending by Employee
              </h3>
              <BreakdownList
                items={spending?.byEmployee || []}
                total={totalSpending}
                emptyText="No employee spending for this month"
                barClass="bg-blue-500"
              />
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-green-400" />
                Income by Category
              </h3>
              <BreakdownList
                items={income?.byCategory || []}
                total={totalIncome}
                emptyText="No income data for this month"
                barClass="bg-green-500"
              />
            </div>
          </div>

          {/* Payroll Breakdown */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-400" />
                Payroll Breakdown
              </h3>
              <span className="text-sm text-gray-400">
                Total: <span className="text-white font-semibold">{formatINR(totalSalary)}</span>
              </span>
            </div>
            {payroll?.list && payroll.list.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {payroll.list.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.status}</p>
                    </div>
                    <p className="text-white text-sm font-semibold shrink-0 ml-3">{formatINR(item.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No payroll data for this month</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
