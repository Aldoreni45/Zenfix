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
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useIsOwner } from '@/lib/hooks';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BusinessIntelligencePage() {
  const isOwner = useIsOwner();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [spendingData, setSpendingData] = useState<any>(null);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [salaryData, setSalaryData] = useState<any>(null);

  const fetchFinancialData = async () => {
    if (!isOwner) return;
    
    setLoading(true);
    setError(null);
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    try {
      const [spendingRes, incomeRes, salaryRes] = await Promise.all([
        api.get(`${apiEndpoints.spendingStats}?year=${year}&month=${month}`),
        api.get(`${apiEndpoints.income}?year=${year}&month=${month}`),
        api.get(`${apiEndpoints.salary}?year=${year}&month=${month}`),
      ]);

      if (spendingRes.error) {
        setError(extractApiErrorMessage(spendingRes));
      } else {
        setSpendingData(spendingRes);
      }

      if (incomeRes.error) {
        setError(extractApiErrorMessage(incomeRes));
      } else {
        setIncomeData(incomeRes);
      }

      if (salaryRes.error) {
        setError(extractApiErrorMessage(salaryRes));
      } else {
        setSalaryData(salaryRes);
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
              onClick={() => setCurrentMonth(prev => {
                const newDate = new Date(prev);
                newDate.setMonth(prev.getMonth() - 1);
                return newDate;
              })}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>
            <span className="text-white font-medium min-w-[180px] text-center">
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(prev => {
                const newDate = new Date(prev);
                newDate.setMonth(prev.getMonth() + 1);
                return newDate;
              })}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <p className="text-white font-semibold">₹{item.amount?.toLocaleString('en-IN') || 0}</p>
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
                        <p className="text-white font-medium">{item.source || 'Uncategorized'}</p>
                        <p className="text-sm text-gray-400">{item.count || 0} transactions</p>
                      </div>
                      <p className="text-white font-semibold">₹{item.amount?.toLocaleString('en-IN') || 0}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No income data available for this month</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
