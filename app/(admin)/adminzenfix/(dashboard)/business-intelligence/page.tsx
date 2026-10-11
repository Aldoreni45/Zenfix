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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useIsOwner } from '@/lib/hooks';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface FinancialBreakdownItem {
  category?: string;
  source?: string;
  amount: number;
  count: number;
}

interface FinancialDataState {
  spending: { total_spending: number; breakdown: FinancialBreakdownItem[] } | null;
  income: { total_income: number; breakdown: FinancialBreakdownItem[] } | null;
  salary: { total_salary: number; salaries: any[] } | null;
}

export default function BusinessIntelligencePage() {
  const isOwner = useIsOwner();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [spendingData, setSpendingData] = useState<{ total_spending: number; breakdown: FinancialBreakdownItem[] } | null>(null);
  const [incomeData, setIncomeData] = useState<{ total_income: number; breakdown: FinancialBreakdownItem[] } | null>(null);
  const [salaryData, setSalaryData] = useState<{ total_salary: number; salaries: any[] } | null>(null);

  const fetchFinancialData = async () => {
    if (!isOwner) return;

    setLoading(true);
    setError(null);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    try {
      const [spendingRes, incomeRes, salaryRes] = await Promise.all([
        api.get<any>(`${apiEndpoints.spendingStats}?year=${year}&month=${month}`),
        api.get<any>(`${apiEndpoints.income}?year=${year}&month=${month}`),
        api.get<any>(`${apiEndpoints.salary}?year=${year}&month=${month}`),
      ]);

      if (spendingRes.error) {
        setError(extractApiErrorMessage(spendingRes));
      } else {
        const rawSpending = spendingRes.data ?? spendingRes;
        const total = typeof rawSpending?.total_spending === 'number'
          ? rawSpending.total_spending
          : (Array.isArray(rawSpending) ? rawSpending.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0) : 0);
        const breakdown = Array.isArray(rawSpending?.breakdown) ? rawSpending.breakdown : [];
        setSpendingData({
          total_spending: total,
          breakdown,
        });
      }

      if (incomeRes.error) {
        setError(extractApiErrorMessage(incomeRes));
      } else {
        const rawIncome = incomeRes.data ?? incomeRes;
        const incomeList: any[] = Array.isArray(rawIncome)
          ? rawIncome
          : (Array.isArray(rawIncome?.data) ? rawIncome.data : []);
        const total = typeof rawIncome?.total_income === 'number'
          ? rawIncome.total_income
          : incomeList.reduce((sum: number, inc: any) => sum + (Number(inc.amount) || 0), 0);

        let breakdown = Array.isArray(rawIncome?.breakdown) ? rawIncome.breakdown : null;
        if (!breakdown || breakdown.length === 0) {
          const breakdownMap = new Map<string, { amount: number; count: number }>();
          incomeList.forEach((inc: any) => {
            const category = inc.category || inc.source || 'Uncategorized';
            const entry = breakdownMap.get(category) || { amount: 0, count: 0 };
            entry.amount += Number(inc.amount) || 0;
            entry.count += 1;
            breakdownMap.set(category, entry);
          });
          breakdown = [...breakdownMap.entries()].map(([source, data]) => ({
            source,
            amount: data.amount,
            count: data.count,
          }));
        }

        setIncomeData({
          total_income: total,
          breakdown,
        });
      }

      if (salaryRes.error) {
        setError(extractApiErrorMessage(salaryRes));
      } else {
        const rawSalary = salaryRes.data ?? salaryRes;
        const salaryList: any[] = Array.isArray(rawSalary)
          ? rawSalary
          : (Array.isArray(rawSalary?.data) ? rawSalary.data : []);
        const total = typeof rawSalary?.total_salary === 'number'
          ? rawSalary.total_salary
          : salaryList.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);

        setSalaryData({
          total_salary: total,
          salaries: salaryList,
        });
      }
    } catch (err) {
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [currentMonth, isOwner]);

  const totalSpending = spendingData?.total_spending || 0;
  const totalIncome = incomeData?.total_income || 0;
  const totalSalary = salaryData?.total_salary || 0;
  const profit = totalIncome - totalSpending - totalSalary;

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Access denied. Business Intelligence is only available to owners.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Business Intelligence</h1>
          <p className="text-gray-400 mt-1">Financial overview and analytics</p>
        </div>
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
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>
            <span className="text-white font-medium min-w-[180px] text-center">
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4 text-slate-400" />
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
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      )}

      {!loading && (
        <>
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Spending */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Wallet className="h-5 w-5 text-red-400" />
                </div>
                <span className="text-xs text-gray-400">Expenses</span>
              </div>
              <p className="text-2xl font-bold text-white">₹{totalSpending.toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-400 mt-1">Total Spending</p>
            </div>

            {/* Total Income */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <ArrowUpRight className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-xs text-gray-400">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-white">₹{totalIncome.toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-400 mt-1">Total Income</p>
            </div>

            {/* Total Salary */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-xs text-gray-400">Payroll</span>
              </div>
              <p className="text-2xl font-bold text-white">₹{totalSalary.toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-400 mt-1">Total Salary Given</p>
            </div>

            {/* Profit */}
            <div className={cn(
              'bg-slate-900/50 border border-white/10 rounded-xl p-6',
              profit >= 0 ? 'border-green-500/20' : 'border-red-500/20'
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  'p-2 rounded-lg border',
                  profit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                )}>
                  <TrendingUp className={cn(
                    'h-5 w-5',
                    profit >= 0 ? 'text-green-400' : 'text-red-400'
                  )} />
                </div>
                <span className="text-xs text-gray-400">Net</span>
              </div>
              <p className={cn(
                'text-2xl font-bold',
                profit >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                ₹{profit.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-400 mt-1">Total Profit</p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Spending Breakdown */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Spending Breakdown</h3>
              {spendingData?.breakdown && spendingData.breakdown.length > 0 ? (
                <div className="space-y-3">
                  {spendingData.breakdown.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{item.category || 'Uncategorized'}</p>
                        <p className="text-sm text-gray-400">{item.count || 0} transactions</p>
                      </div>
                      <p className="text-white font-semibold">₹{(item.amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No spending data available for this month</p>
              )}
            </div>

            {/* Income Breakdown */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Income Breakdown</h3>
              {incomeData?.breakdown && incomeData.breakdown.length > 0 ? (
                <div className="space-y-3">
                  {incomeData.breakdown.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{item.source || item.category || 'Uncategorized'}</p>
                        <p className="text-sm text-gray-400">{item.count || 0} transactions</p>
                      </div>
                      <p className="text-white font-semibold">₹{(item.amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No income data available for this month</p>
              )}
            </div>

            {/* Payroll Breakdown */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Payroll Breakdown</h3>
              {salaryData?.salaries && salaryData.salaries.length > 0 ? (
                <div className="space-y-3">
                  {salaryData.salaries.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{item.employee_name || 'Employee'}</p>
                        <p className="text-sm text-gray-400 capitalize">{item.status || 'Paid'}</p>
                      </div>
                      <p className="text-white font-semibold">₹{(item.amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No payroll data available for this month</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
