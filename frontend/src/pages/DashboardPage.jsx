import React, { useEffect, useState, useCallback } from 'react';
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
  Calendar,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  ChevronRight,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../api/analytics';
import { transactionsApi } from '../api/transactions';
import { accountsApi } from '../api/accounts';
import { categoriesApi } from '../api/categories';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';
import Modal from '../components/Modal';

const DEFAULT_PALETTE = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444', '#64748B'];

export default function DashboardPage() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'INR';

  // Analytics data states
  const [data, setData] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendMonths, setTrendMonths] = useState(6);

  // Quick Add Modal states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    transaction_type: 'EXPENSE',
    amount: '',
    account: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    merchant_name: '',
    description: '',
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, txns, accs, cats] = await Promise.all([
        analyticsApi.getOverview(trendMonths),
        transactionsApi.getTransactions({ page_size: 5 }),
        accountsApi.getAccounts(),
        categoriesApi.getCategories(),
      ]);

      setData(overview);
      setRecentTxns(txns.results || txns);
      setAccounts(accs);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [trendMonths]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleOpenQuickAdd = () => {
    setFormError('');
    setFormData({
      transaction_type: 'EXPENSE',
      amount: '',
      account: accounts[0]?.id || '',
      category: categories.find((c) => c.category_type === 'EXPENSE')?.id || '',
      date: new Date().toISOString().split('T')[0],
      merchant_name: '',
      description: '',
    });
    setIsQuickAddOpen(true);
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setModalLoading(true);

    try {
      await transactionsApi.createTransaction({
        transaction_type: formData.transaction_type,
        amount: formData.amount,
        account: formData.account,
        category: formData.category || null,
        date: formData.date,
        merchant_name: formData.merchant_name,
        description: formData.description,
      });

      setIsQuickAddOpen(false);
      await loadDashboard();
    } catch (err) {
      const respData = err.response?.data;
      let msg = 'Failed to create transaction.';
      if (typeof respData === 'object') {
        const firstKey = Object.keys(respData)[0];
        msg = `${firstKey}: ${Array.isArray(respData[firstKey]) ? respData[firstKey][0] : respData[firstKey]}`;
      }
      setFormError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const cur = data?.current_month || {};
  const trends = data?.trends || [];
  const expenseCategories = data?.expense_categories || [];
  const incomeCategories = data?.income_categories || [];
  const userAccounts = data?.accounts || [];

  // Custom Recharts Dark Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 z-50">
          <p className="font-semibold text-white mb-1.5">{label}</p>
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-semibold text-white">
                {formatCurrency(item.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{cur.month_label || 'Current Period'} Financial Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome, {user?.username || user?.email?.split('@')[0]}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time calculations across your accounts, cash flows, and category budgets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenQuickAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-semibold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Net Worth
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(data?.net_worth || 0, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Across {userAccounts.length} active account{userAccounts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Monthly Income */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Monthly Income
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            {formatCurrency(cur.income || 0, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">For {cur.month_label}</p>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Monthly Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">
            {formatCurrency(cur.expense || 0, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">For {cur.month_label}</p>
        </div>

        {/* Savings Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Savings Rate
            </span>
            <div
              className={`p-2 rounded-xl ${
                (cur.savings_rate || 0) >= 20
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : (cur.savings_rate || 0) > 0
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p
              className={`text-2xl font-bold ${
                (cur.savings_rate || 0) >= 20
                  ? 'text-emerald-400'
                  : (cur.savings_rate || 0) > 0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {formatPercent(cur.savings_rate || 0)}
            </p>
            <span className="text-xs text-slate-500">
              ({formatCurrency(cur.savings || 0, currency)} saved)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Target: {cur.savings_target_percentage || 20}%</p>
        </div>
      </div>

      {/* Chart Section: Trends & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Income & Expense Trends
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly historical progression of cash inflows and outflows
              </p>
            </div>

            {/* Time period switcher */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
              {[
                { label: '3M', value: 3 },
                { label: '6M', value: 6 },
                { label: '12M', value: 12 },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTrendMonths(t.value)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    trendMonths === t.value
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            {trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No trend data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#F43F5E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Breakdown Donut (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-rose-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Expense Breakdown</h2>
            </div>
            <p className="text-xs text-slate-400">Distribution by category this month</p>
          </div>

          <div className="h-48 w-full my-2">
            {expenseCategories.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No expense transactions this month.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]}
                      />
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
            )}
          </div>

          {/* Category List */}
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {expenseCategories.slice(0, 4).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-slate-300 truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {formatCurrency(cat.total, currency)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatPercent(cat.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Row: Accounts Breakdown + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linked Accounts Widget (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Your Accounts</h2>
            </div>
            <Link
              to="/transactions"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {userAccounts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No accounts found.</p>
            ) : (
              userAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: acc.color || '#3B82F6' }}
                      />
                      <span className="text-xs font-medium text-white">{acc.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white">
                      {formatCurrency(acc.balance, currency)}
                    </span>
                  </div>
                  {/* Proportion bar */}
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, acc.percentage))}%`,
                        backgroundColor: acc.color || '#3B82F6',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Table (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Recent Transactions</h2>
            </div>
            <Link
              to="/transactions"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading activity...</div>
          ) : recentTxns.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs space-y-2">
              <p>No transactions recorded yet.</p>
              <button
                type="button"
                onClick={handleOpenQuickAdd}
                className="text-emerald-400 hover:underline font-semibold"
              >
                + Add your first transaction
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentTxns.map((t) => {
                const isExp = t.transaction_type === 'EXPENSE';
                const isInc = t.transaction_type === 'INCOME';
                return (
                  <div key={t.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isExp
                            ? 'bg-rose-500/10 text-rose-400'
                            : isInc
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {isExp ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : isInc ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowRightLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {t.merchant_name || t.description || 'Transaction'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(t.date)} • {t.category_details?.name || 'General'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        isExp ? 'text-rose-400' : isInc ? 'text-emerald-400' : 'text-blue-400'
                      }`}
                    >
                      {isExp ? '-' : isInc ? '+' : ''}
                      {formatCurrency(t.amount, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Modal */}
      <Modal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        title="Quick Add Transaction"
      >
        <form onSubmit={handleQuickAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {formError}
            </div>
          )}

          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl">
            {['EXPENSE', 'INCOME'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData({ ...formData, transaction_type: t })}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  formData.transaction_type === t
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'EXPENSE' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Amount ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Account *
              </label>
              <select
                required
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
              >
                <option value="">Select Account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.balance, currency)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
              >
                <option value="">Select Category</option>
                {categories
                  .filter((c) => c.category_type === formData.transaction_type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Description / Merchant
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value, merchant_name: e.target.value })}
              placeholder="e.g. Swiggy food delivery"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95"
            >
              {modalLoading ? 'Saving...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
