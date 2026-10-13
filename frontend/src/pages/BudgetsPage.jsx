import React, { useState, useEffect, useCallback } from 'react';
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  TrendingUp,
  Tag,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { budgetsApi } from '../api/budgets';
import { categoriesApi } from '../api/categories';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function BudgetsPage() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'INR';

  const [currentDate, setCurrentDate] = useState(new Date());
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
  const monthDisplay = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({
    total_budget: 0,
    total_spent: 0,
    total_remaining: 0,
    overall_utilization_percentage: 0,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, budgetList, catList] = await Promise.all([
        budgetsApi.getSummary(monthKey),
        budgetsApi.getBudgets(monthKey),
        categoriesApi.getCategories('EXPENSE'),
      ]);
      setSummary(sumData);
      setBudgets(budgetList);
      setCategories(catList);
    } catch (err) {
      console.error('Failed loading budgets:', err);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const handleOpenAdd = () => {
    setFormError('');
    // Pick the first category that does not already have a budget this month
    const existingCatIds = new Set(budgets.map((b) => b.category));
    const availableCat = categories.find((c) => !existingCatIds.has(c.id));
    setFormData({
      category: availableCat ? availableCat.id : (categories[0]?.id || ''),
      amount: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (b) => {
    setFormError('');
    setSelectedBudget(b);
    setFormData({
      category: b.category,
      amount: b.amount,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (b) => {
    setSelectedBudget(b);
    setIsDeleteOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setFormError('');
    setModalLoading(true);

    try {
      if (isEditOpen && selectedBudget) {
        await budgetsApi.updateBudget(selectedBudget.id, {
          amount: formData.amount,
        });
        setIsEditOpen(false);
      } else {
        await budgetsApi.createBudget({
          category: formData.category,
          amount: formData.amount,
          month: monthKey,
        });
        setIsAddOpen(false);
      }
      await loadData();
    } catch (err) {
      const resp = err.response?.data;
      let msg = 'Failed to save budget.';
      if (typeof resp === 'object') {
        const firstKey = Object.keys(resp)[0];
        msg = `${firstKey}: ${Array.isArray(resp[firstKey]) ? resp[firstKey][0] : resp[firstKey]}`;
      }
      setFormError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBudget) return;
    setModalLoading(true);
    try {
      await budgetsApi.deleteBudget(selectedBudget.id);
      setIsDeleteOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Monthly Budgets</h1>
          <p className="text-sm text-slate-400">
            Set spending caps per category and track utilization with color-coded safety tiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-white whitespace-nowrap min-w-[110px] text-center">
              {monthDisplay}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-semibold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Aggregate Budget Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Overall Monthly Budget Utilization
            </span>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-white">
                {formatCurrency(summary.total_spent, currency)}
              </p>
              <span className="text-sm font-medium text-slate-400">
                of {formatCurrency(summary.total_budget, currency)} limit
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <p className="text-slate-400 font-medium">Remaining</p>
              <p
                className={`text-base font-bold mt-0.5 ${
                  summary.total_remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(summary.total_remaining, currency)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <p className="text-slate-400 font-medium">Utilization</p>
              <p
                className={`text-base font-bold mt-0.5 ${
                  summary.overall_utilization_percentage > 90
                    ? 'text-rose-400'
                    : summary.overall_utilization_percentage >= 70
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {formatPercent(summary.overall_utilization_percentage)}
              </p>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              summary.overall_utilization_percentage > 90
                ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                : summary.overall_utilization_percentage >= 70
                ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, summary.overall_utilization_percentage))}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Safe (&lt; 70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Warning (70% - 90%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Danger / Exceeded (&gt; 90%)</span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight">Category Breakdown</h2>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            Loading category budgets...
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <PiggyBank className="w-6 h-6" />
            </div>
            <p className="font-semibold text-white">No budgets configured for {monthDisplay}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Set monthly spending targets for categories like Groceries, Dining, and Utilities to keep expenses in check.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
            >
              Set First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const m = b.metrics || {};
              const pct = m.utilization_percentage || 0;
              const isDanger = m.color_state === 'red';
              const isWarning = m.color_state === 'amber';

              return (
                <div
                  key={b.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2.5 rounded-xl text-white font-bold"
                        style={{ backgroundColor: `${m.category_color || '#10B981'}25` }}
                      >
                        <Tag className="w-4 h-4" style={{ color: m.category_color || '#10B981' }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{m.category_name}</h3>
                        <p className="text-xs text-slate-400">Limit: {formatCurrency(m.limit, currency)}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isDanger
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  {/* Progress & Numbers */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">
                        Spent: {formatCurrency(m.spent, currency)}
                      </span>
                      <span
                        className={
                          isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                        }
                      >
                        {formatPercent(pct)}
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/40">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {m.remaining >= 0
                          ? `${formatCurrency(m.remaining, currency)} remaining`
                          : `${formatCurrency(Math.abs(m.remaining), currency)} over limit`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Budget Limit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Set / Edit Budget Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
        }}
        title={isEditOpen ? 'Edit Category Budget' : `Set Budget for ${monthDisplay}`}
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {formError}
            </div>
          )}

          {!isEditOpen && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Monthly Limit ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 15000"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold text-sm focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
              }}
              className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95"
            >
              {modalLoading ? 'Saving...' : isEditOpen ? 'Update Budget' : 'Set Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Budget Target?"
        message={`Are you sure you want to remove the ${selectedBudget?.category_details?.name} budget of ${formatCurrency(
          selectedBudget?.amount,
          currency
        )} for ${monthDisplay}?`}
        confirmText="Delete"
        isLoading={modalLoading}
        isDanger={true}
      />
    </div>
  );
}
