import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  ArrowUpRight,
  Trophy,
  Coins,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { goalsApi } from '../api/goals';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function GoalsPage() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'INR';

  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState({
    total_goals: 0,
    completed_goals: 0,
    total_target_amount: 0,
    total_saved_amount: 0,
    overall_progress_percentage: 0,
  });
  const [filterTab, setFilterTab] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '0.00',
    target_date: '',
    color: '#10B981',
    notes: '',
  });

  const [contributeAmount, setContributeAmount] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const completedParam = filterTab === 'ALL' ? null : filterTab === 'COMPLETED';
      const [sumData, goalList] = await Promise.all([
        goalsApi.getSummary(),
        goalsApi.getGoals(completedParam),
      ]);
      setSummary(sumData);
      setGoals(goalList);
    } catch (err) {
      console.error('Failed loading goals:', err);
    } finally {
      setLoading(false);
    }
  }, [filterTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setFormError('');
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '0.00',
      target_date: '',
      color: '#10B981',
      notes: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setFormError('');
    setSelectedGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      target_date: goal.target_date || '',
      color: goal.color || '#10B981',
      notes: goal.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleOpenContribute = (goal) => {
    setFormError('');
    setSelectedGoal(goal);
    setContributeAmount('');
    setIsContributeOpen(true);
  };

  const handleOpenDelete = (goal) => {
    setSelectedGoal(goal);
    setIsDeleteOpen(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setFormError('');
    setModalLoading(true);

    try {
      const payload = {
        name: formData.name,
        target_amount: formData.target_amount,
        current_amount: formData.current_amount || '0.00',
        target_date: formData.target_date || null,
        color: formData.color,
        notes: formData.notes,
      };

      if (isEditOpen && selectedGoal) {
        await goalsApi.updateGoal(selectedGoal.id, payload);
        setIsEditOpen(false);
      } else {
        await goalsApi.createGoal(payload);
        setIsAddOpen(false);
      }
      await loadData();
    } catch (err) {
      const resp = err.response?.data;
      let msg = 'Failed to save goal.';
      if (typeof resp === 'object') {
        const firstKey = Object.keys(resp)[0];
        msg = `${firstKey}: ${Array.isArray(resp[firstKey]) ? resp[firstKey][0] : resp[firstKey]}`;
      }
      setFormError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleContributeSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setModalLoading(true);

    try {
      await goalsApi.contribute(selectedGoal.id, contributeAmount);
      setIsContributeOpen(false);
      await loadData();
    } catch (err) {
      const resp = err.response?.data;
      let msg = 'Failed to deposit to goal.';
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
    if (!selectedGoal) return;
    setModalLoading(true);
    try {
      await goalsApi.deleteGoal(selectedGoal.id);
      setIsDeleteOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial Goals</h1>
          <p className="text-sm text-slate-400">
            Set target savings milestones, deposit funds, and monitor progress over time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goal Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Saved Towards Goals
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            {formatCurrency(summary.total_saved_amount, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            of {formatCurrency(summary.total_target_amount, currency)} target
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Overall Progress
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-teal-400 mt-2">
            {formatPercent(summary.overall_progress_percentage)}
          </p>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-teal-500 rounded-full"
              style={{ width: `${Math.min(100, summary.overall_progress_percentage)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Goals
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {summary.total_goals - summary.completed_goals}
          </p>
          <p className="text-xs text-slate-500 mt-1">Goals currently in progress</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Milestones
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">
            {summary.completed_goals}
          </p>
          <p className="text-xs text-slate-500 mt-1">Achieved targets</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {[
            { label: 'In Progress', value: 'ACTIVE' },
            { label: 'Completed', value: 'COMPLETED' },
            { label: 'All Goals', value: 'ALL' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterTab(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === tab.value
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
          Loading your financial goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Target className="w-6 h-6" />
          </div>
          <p className="font-semibold text-white">No goals in this view</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create financial milestones like an Emergency Fund, Travel Vacation, or Vehicle Purchase.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
          >
            Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const isDone = g.is_completed || g.progress_percentage >= 100;
            return (
              <div
                key={g.id}
                className={`bg-slate-900 border ${
                  isDone ? 'border-amber-500/30' : 'border-slate-800'
                } rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden`}
              >
                {isDone && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl shadow-md">
                    Achieved 🏆
                  </div>
                )}

                {/* Top Section */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-2xl text-white font-bold"
                      style={{ backgroundColor: `${g.color || '#10B981'}25` }}
                    >
                      <Target className="w-5 h-5" style={{ color: g.color || '#10B981' }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{g.name}</h3>
                      {g.target_date && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Target: {formatDate(g.target_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold text-white">
                        {formatCurrency(g.current_amount, currency)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">
                        / {formatCurrency(g.target_amount, currency)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatPercent(g.progress_percentage)}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/40 p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, g.progress_percentage))}%`,
                        backgroundColor: g.color || '#10B981',
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {g.remaining_amount > 0
                        ? `${formatCurrency(g.remaining_amount, currency)} to reach target`
                        : 'Target reached! 🎉'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleOpenContribute(g)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Deposit Funds</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(g)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(g)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
        }}
        title={isEditOpen ? 'Edit Goal' : 'Create Financial Goal'}
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Emergency Fund, Japan Trip"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Target Amount ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                placeholder="50000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Initial Saved Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Color Tag
              </label>
              <div className="flex items-center gap-2 mt-1">
                {['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      formData.color === color ? 'scale-110 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
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
              {modalLoading ? 'Saving...' : isEditOpen ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        isOpen={isContributeOpen}
        onClose={() => setIsContributeOpen(false)}
        title={`Deposit Funds to "${selectedGoal?.name}"`}
      >
        <form onSubmit={handleContributeSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {formError}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Progress:</span>
            <span className="font-bold text-white">
              {formatCurrency(selectedGoal?.current_amount, currency)} /{' '}
              {formatCurrency(selectedGoal?.target_amount, currency)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Deposit Amount ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold text-sm focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsContributeOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95"
            >
              {modalLoading ? 'Depositing...' : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Financial Goal?"
        message={`Are you sure you want to delete "${selectedGoal?.name}"? You have saved ${formatCurrency(
          selectedGoal?.current_amount,
          currency
        )} towards this goal.`}
        confirmText="Delete Goal"
        isLoading={modalLoading}
        isDanger={true}
      />
    </div>
  );
}
