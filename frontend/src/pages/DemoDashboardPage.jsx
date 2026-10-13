import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  PiggyBank,
  Plus,
  ArrowRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  AlertCircle,
  Percent,
  Lock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';

const DEMO_TRENDS = [
  { month: '2026-03', label: 'Mar 2026', income: 75000, expense: 42000, savings: 33000, savings_rate: 44.0 },
  { month: '2026-04', label: 'Apr 2026', income: 75000, expense: 49000, savings: 26000, savings_rate: 34.7 },
  { month: '2026-05', label: 'May 2026', income: 82000, expense: 45000, savings: 37000, savings_rate: 45.1 },
  { month: '2026-06', label: 'Jun 2026', income: 80000, expense: 52000, savings: 28000, savings_rate: 35.0 },
  { month: '2026-07', label: 'Jul 2026', income: 85000, expense: 47000, savings: 38000, savings_rate: 44.7 },
  { month: '2026-08', label: 'Aug 2026', income: 95000, expense: 51250, savings: 43750, savings_rate: 46.1 },
];

const DEMO_CATEGORIES = [
  { name: 'Housing & Rent', total: 22000, percentage: 42.9, color: '#6366F1' },
  { name: 'Food & Dining', total: 11500, percentage: 22.4, color: '#F97316' },
  { name: 'Groceries', total: 7250, percentage: 14.1, color: '#10B981' },
  { name: 'Utilities', total: 4500, percentage: 8.8, color: '#EAB308' },
  { name: 'Transportation', total: 3500, percentage: 6.8, color: '#06B6D4' },
  { name: 'Entertainment', total: 2500, percentage: 4.9, color: '#EC4899' },
];

const DEMO_ACCOUNTS = [
  { id: 1, name: 'HDFC Salary Account', balance: 145000, color: '#3B82F6', percentage: 58.0 },
  { id: 2, name: 'ICICI Savings', balance: 85000, color: '#10B981', percentage: 34.0 },
  { id: 3, name: 'Cash Wallet', balance: 20000, color: '#F59E0B', percentage: 8.0 },
];

const DEMO_TRANSACTIONS = [
  { id: 1, date: '2026-08-28', merchant_name: 'Tech Corp Inc', description: 'August Salary', transaction_type: 'INCOME', amount: 95000, category_name: 'Salary', color: '#10B981', account_name: 'HDFC Salary Account' },
  { id: 2, date: '2026-08-25', merchant_name: 'Landlord Rent', description: 'Apartment Monthly Rent', transaction_type: 'EXPENSE', amount: 22000, category_name: 'Housing & Rent', color: '#6366F1', account_name: 'HDFC Salary Account' },
  { id: 3, date: '2026-08-22', merchant_name: 'Swiggy Gourmet', description: 'Weekend Dinner', transaction_type: 'EXPENSE', amount: 1450, category_name: 'Food & Dining', color: '#F97316', account_name: 'ICICI Savings' },
  { id: 4, date: '2026-08-20', merchant_name: 'Blinkit Supermarket', description: 'Weekly Groceries', transaction_type: 'EXPENSE', amount: 2850, category_name: 'Groceries', color: '#10B981', account_name: 'ICICI Savings' },
  { id: 5, date: '2026-08-18', merchant_name: 'Uber India', description: 'Airport Cab', transaction_type: 'EXPENSE', amount: 820, category_name: 'Transportation', color: '#06B6D4', account_name: 'Cash Wallet' },
];

export default function DemoDashboardPage() {
  const currency = 'INR';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Demo Banner */}
      <div className="sticky top-0 z-50 bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-medium">
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider">
              DEMO MODE
            </span>
            <span>You are viewing a read-only sample financial portfolio. Data is illustrative and isolated.</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/register"
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all"
            >
              Create Free Account →
            </Link>
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              Exit Demo
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample Dashboard Experience</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              FinTrack AI Interactive Demo
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Explore live charts, balance aggregations, category distributions, and analytics.
            </p>
          </div>

          <Link
            to="/register"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 text-sm font-semibold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your Own Dashboard</span>
          </Link>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Net Worth
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {formatCurrency(250000, currency)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across 3 demo accounts</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Monthly Income
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-2">
              {formatCurrency(95000, currency)}
            </p>
            <p className="text-xs text-slate-500 mt-1">August 2026</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Monthly Expenses
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-400 mt-2">
              {formatCurrency(51250, currency)}
            </p>
            <p className="text-xs text-slate-500 mt-1">August 2026</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Savings Rate
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-emerald-400">46.1%</p>
              <span className="text-xs text-slate-500">({formatCurrency(43750, currency)} saved)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Target: 20%</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Area Chart */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Income &amp; Expense Trends</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Historical monthly comparison over 6 months</p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DEMO_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="demoInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="demoExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#demoInc)" />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#demoExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown Donut */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PieIcon className="w-4 h-4 text-rose-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Expense Breakdown</h2>
              </div>
              <p className="text-xs text-slate-400">Category allocation for August</p>
            </div>

            <div className="h-48 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DEMO_CATEGORIES}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {DEMO_CATEGORIES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value, currency), 'Spent']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {DEMO_CATEGORIES.slice(0, 4).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-300 truncate">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(cat.total, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Accounts & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accounts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Demo Accounts</h2>
            </div>

            <div className="space-y-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <div key={acc.id} className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white">{acc.name}</span>
                    <span className="text-white">{formatCurrency(acc.balance, currency)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${acc.percentage}%`, backgroundColor: acc.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Feed */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Recent Demo Transactions</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">5 items</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {DEMO_TRANSACTIONS.map((t) => {
                const isExp = t.transaction_type === 'EXPENSE';
                return (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isExp ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {isExp ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{t.merchant_name}</p>
                        <p className="text-xs text-slate-500">{formatDate(t.date)} • {t.category_name}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isExp ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isExp ? '-' : '+'}{formatCurrency(t.amount, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
