import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle,
  Tag,
  Building,
  Calendar,
  DollarSign,
  Edit3,
  Bot,
  RotateCcw,
} from 'lucide-react';
import Modal from './Modal';
import { aiApi } from '../api/ai';
import { transactionsApi } from '../api/transactions';
import { formatCurrency } from '../utils/formatters';

export default function AddWithAIModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToManual,
  currency = 'INR',
}) {
  const [promptText, setPromptText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedProposal, setParsedProposal] = useState(null);
  const [parseError, setParseError] = useState('');

  const samplePrompts = [
    'Spent ₹450 at Swiggy for dinner',
    'Paid ₹12,000 for house rent via HDFC Bank',
    'Received salary of ₹75,000 in bank',
    'Uber cab ride to office ₹320',
  ];

  const handleParse = async (textToParse) => {
    const text = textToParse || promptText;
    if (!text.trim()) return;

    setIsParsing(true);
    setParseError('');
    setParsedProposal(null);

    try {
      const res = await aiApi.parseTransaction(text);
      if (res.success) {
        setParsedProposal(res);
      } else {
        setParseError(res.error || 'AI could not confidently parse your input.');
      }
    } catch (err) {
      setParseError(
        err.response?.data?.error ||
          'Could not extract transaction. Please try another phrasing or enter manually.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!parsedProposal) return;
    setIsSaving(true);
    try {
      await transactionsApi.createTransaction({
        transaction_type: parsedProposal.transaction_type,
        amount: parsedProposal.amount,
        account: parsedProposal.account_id,
        category: parsedProposal.category_id,
        date: parsedProposal.date,
        merchant_name: parsedProposal.merchant_name,
        description: parsedProposal.description,
      });

      handleReset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setParseError('Failed to save transaction to database. Please check your accounts.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPromptText('');
    setParsedProposal(null);
    setParseError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Add Transaction with AI"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Intro */}
        <p className="text-xs text-slate-400">
          Type or speak naturally (e.g. <em>"Spent ₹450 at Starbucks"</em>). FinTrack AI extracts the
          structured details for your review before saving.
        </p>

        {/* Input prompt */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. Paid ₹850 at Dominos for team pizza party..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Quick Examples */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500">Try:</span>
            {samplePrompts.slice(0, 2).map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPromptText(sample);
                  handleParse(sample);
                }}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Parse Button */}
        {!parsedProposal && (
          <button
            type="button"
            onClick={() => handleParse()}
            disabled={isParsing || !promptText.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-semibold shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all"
          >
            {isParsing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Analyzing text with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse Transaction</span>
              </>
            )}
          </button>
        )}

        {/* Failure Path Error & Fallback */}
        {parseError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
            <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Prefer entering details manually?</span>
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                  if (onSwitchToManual) onSwitchToManual();
                }}
                className="text-emerald-400 hover:underline font-semibold text-xs"
              >
                Switch to Manual Form →
              </button>
            </div>
          </div>
        )}

        {/* Structured Proposal Preview Card */}
        {parsedProposal && (
          <div className="p-4 bg-slate-800/80 border border-emerald-500/30 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>AI Structured Proposal</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">
                {parsedProposal.confidence ? `${Math.round(parsedProposal.confidence * 100)}% Match` : 'Parsed'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Amount</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                  {formatCurrency(parsedProposal.amount, currency)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Type</span>
                <span
                  className={`text-xs font-bold mt-1 block ${
                    parsedProposal.transaction_type === 'EXPENSE' ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {parsedProposal.transaction_type}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                <span className="text-slate-200 font-medium mt-0.5 block">
                  {parsedProposal.category_name}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Account</span>
                <span className="text-slate-200 font-medium mt-0.5 block">
                  {parsedProposal.account_name}
                </span>
              </div>
            </div>

            {parsedProposal.merchant_name && (
              <div className="text-xs text-slate-400 px-1">
                Merchant / Description: <span className="text-white font-medium">{parsedProposal.merchant_name}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-type</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  {isSaving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
