import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Calendar,
  Wallet,
  Tag,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Sparkles,
  Building,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { transactionsApi } from '../api/transactions';
import { accountsApi } from '../api/accounts';
import { categoriesApi } from '../api/categories';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AddWithAIModal from '../components/AddWithAIModal';

export default function TransactionsPage() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'INR';

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net_flow: 0, count: 0 });
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form state
  const initialForm = {
    transaction_type: 'EXPENSE',
    amount: '',
    account: '',
    category: '',
    transfer_to_account: '',
    date: new Date().toISOString().split('T')[0],
    merchant_name: '',
    description: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Load supporting data (accounts, categories)
  const loadPrerequisites = async () => {
    try {
      const [accs, cats] = await Promise.all([
        accountsApi.getAccounts(),
        categoriesApi.getCategories(),
      ]);

      // If user has no accounts yet, auto-create a default Main Bank Account for convenience
      if (accs.length === 0) {
        const defaultAcc = await accountsApi.createAccount({
          name: 'Main Bank Account',
          account_type: 'BANK',
          balance: 10000.0,
          currency,
        });
        setAccounts([defaultAcc]);
      } else {
        setAccounts(accs);
      }

      setCategories(cats);
    } catch (err) {
      console.error('Failed loading accounts/categories:', err);
    }
  };

  // Fetch transactions with applied filters
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
      };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (accountFilter) params.account = accountFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [data, summaryData] = await Promise.all([
        transactionsApi.getTransactions(params),
        transactionsApi.getSummary(params),
      ]);

      setTransactions(data.results || data);
      setTotalCount(data.count || (data.results ? data.results.length : data.length));
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, categoryFilter, accountFilter, startDate, endDate]);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setAccountFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleOpenAdd = () => {
    setFormError('');
    setFormData({
      ...initialForm,
      account: accounts[0]?.id || '',
      category: categories.find((c) => c.category_type === 'EXPENSE')?.id || '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (txn) => {
    setFormError('');
    setSelectedTxn(txn);
    setFormData({
      transaction_type: txn.transaction_type,
      amount: txn.amount,
      account: txn.account,
      category: txn.category || '',
      transfer_to_account: txn.transfer_to_account || '',
      date: txn.date,
      merchant_name: txn.merchant_name || '',
      description: txn.description || '',
      notes: txn.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (txn) => {
    setSelectedTxn(txn);
    setIsDeleteOpen(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setFormError('');
    setModalLoading(true);

    try {
      const payload = {
        transaction_type: formData.transaction_type,
        amount: formData.amount,
        account: formData.account,
        category: formData.category || null,
        transfer_to_account:
          formData.transaction_type === 'TRANSFER' ? formData.transfer_to_account : null,
        date: formData.date,
        merchant_name: formData.merchant_name,
        description: formData.description,
        notes: formData.notes,
      };

      if (isEditOpen && selectedTxn) {
        await transactionsApi.updateTransaction(selectedTxn.id, payload);
        setIsEditOpen(false);
      } else {
        await transactionsApi.createTransaction(payload);
        setIsAddOpen(false);
      }

      await fetchTransactions();
      // Also refresh accounts list so balances reflect the changes
      const updatedAccs = await accountsApi.getAccounts();
      setAccounts(updatedAccs);
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Failed to save transaction.';
      if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        msg = `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`;
      }
      setFormError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTxn) return;
    setModalLoading(true);
    try {
      await transactionsApi.deleteTransaction(selectedTxn.id);
      setIsDeleteOpen(false);
      await fetchTransactions();
      const updatedAccs = await accountsApi.getAccounts();
      setAccounts(updatedAccs);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredCategoriesForForm = categories.filter((c) =>
    formData.transaction_type === 'TRANSFER' ? true : c.category_type === formData.transaction_type
  );

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-sm text-slate-400">
            View, filter, and manage all your income, expenses, and transfers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAIOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 font-semibold text-sm shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Add with AI</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Income
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            {formatCurrency(summary.total_income, currency)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">
            {formatCurrency(summary.total_expense, currency)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Cash Flow
            </span>
            <div
              className={`p-2 rounded-xl ${
                summary.net_flow >= 0
                  ? 'bg-teal-500/10 text-teal-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-bold mt-2 ${
              summary.net_flow >= 0 ? 'text-teal-400' : 'text-amber-400'
            }`}
          >
            {formatCurrency(summary.net_flow, currency)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search merchant, description, tags..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 shrink-0">
            {[
              { label: 'All', value: '' },
              { label: 'Expenses', value: 'EXPENSE' },
              { label: 'Income', value: 'INCOME' },
              { label: 'Transfers', value: 'TRANSFER' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setTypeFilter(tab.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === tab.value
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters & Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category_type})
                </option>
              ))}
            </select>
          </div>

          {/* Account Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Account
            </label>
            <select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.get_account_type_display || a.account_type})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* End Date & Reset */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset all filters"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Description / Merchant</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Account</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                        <Tag className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-white">No transactions found</p>
                      <p className="text-xs text-slate-500">
                        Try clearing your filters or add your first transaction.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                      >
                        Add Transaction
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isExp = txn.transaction_type === 'EXPENSE';
                  const isInc = txn.transaction_type === 'INCOME';
                  const isTrf = txn.transaction_type === 'TRANSFER';

                  return (
                    <tr key={txn.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap text-slate-400">
                        {formatDate(txn.date)}
                      </td>

                      {/* Description & Merchant */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
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
                            <p className="font-medium text-white text-sm">
                              {txn.merchant_name || txn.description || 'Transaction'}
                            </p>
                            {txn.merchant_name && txn.description && (
                              <p className="text-xs text-slate-500">{txn.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {txn.category_details ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${txn.category_details.color}20`,
                              color: txn.category_details.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: txn.category_details.color }}
                            />
                            {txn.category_details.name}
                          </span>
                        ) : isTrf ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                            Transfer
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Uncategorized</span>
                        )}
                      </td>

                      {/* Account */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>{txn.account_details?.name || 'Account'}</span>
                          {isTrf && txn.transfer_to_account_details && (
                            <span className="text-slate-500">
                              → {txn.transfer_to_account_details.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-semibold text-sm">
                        <span
                          className={
                            isExp
                              ? 'text-rose-400'
                              : isInc
                              ? 'text-emerald-400'
                              : 'text-blue-400'
                          }
                        >
                          {isExp ? '-' : isInc ? '+' : ''}
                          {formatCurrency(txn.amount, currency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(txn)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(txn)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {transactions.length} of {totalCount} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
        }}
        title={isEditOpen ? 'Edit Transaction' : 'New Transaction'}
      >
        <form onSubmit={handleSaveTransaction} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-800 p-1 rounded-xl">
              {[
                { label: 'Expense', value: 'EXPENSE' },
                { label: 'Income', value: 'INCOME' },
                { label: 'Transfer', value: 'TRANSFER' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, transaction_type: t.value })}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    formData.transaction_type === t.value
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Account and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {formData.transaction_type === 'TRANSFER' ? 'Source Account *' : 'Account *'}
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

            {formData.transaction_type === 'TRANSFER' ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Destination Account *
                </label>
                <select
                  required
                  value={formData.transfer_to_account}
                  onChange={(e) => setFormData({ ...formData, transfer_to_account: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="">Select Destination</option>
                  {accounts
                    .filter((a) => String(a.id) !== String(formData.account))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance, currency)})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
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
                  {filteredCategoriesForForm.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Merchant & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Merchant / Payee
              </label>
              <input
                type="text"
                value={formData.merchant_name}
                onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                placeholder="e.g. Swiggy, Amazon, Netflix"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Dinner with team"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
              }}
              className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {modalLoading && (
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              )}
              <span>{isEditOpen ? 'Save Changes' : 'Create Transaction'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Add with AI Modal */}
      <AddWithAIModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onSuccess={() => {
          fetchTransactions();
          accountsApi.getAccounts().then(setAccounts);
        }}
        onSwitchToManual={handleOpenAdd}
        currency={currency}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction?"
        message={`Are you sure you want to delete this ${selectedTxn?.transaction_type?.toLowerCase()} of ${formatCurrency(
          selectedTxn?.amount,
          currency
        )}? This will revert the balance on your account.`}
        confirmText="Delete"
        isLoading={modalLoading}
        isDanger={true}
      />
    </div>
  );
}
