import React from 'react';
import { Menu, Plus, Sparkles, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuClick, onQuickAddClick }) {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'INR';

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-emerald-400">
            {currency}
          </span>
          <span>Personal Finance</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onQuickAddClick && (
          <button
            type="button"
            onClick={onQuickAddClick}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-semibold shadow-md shadow-emerald-500/10 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>
        )}
      </div>
    </header>
  );
}
