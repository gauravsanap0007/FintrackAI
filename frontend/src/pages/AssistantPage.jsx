import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  User,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { aiApi } from '../api/ai';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

export default function AssistantPage() {
  const { user } = useAuth();
  const currency = user?.profile?.currency || 'INR';

  // Insights State
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Chat State
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.username || 'there'}! I am your AI Financial Assistant. I analyze your real-time financial ledger and provide grounded answers about your expenses, budgets, savings rates, and account balances. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const samplePrompts = [
    'How much did I spend this month?',
    'What is my current savings rate?',
    'What was my largest expense category?',
    'What is my total net worth across all accounts?',
  ];

  useEffect(() => {
    const loadInsights = async () => {
      setInsightsLoading(true);
      try {
        const list = await aiApi.getInsights();
        setInsights(list || []);
      } catch (err) {
        console.error('Failed loading insights:', err);
      } finally {
        setInsightsLoading(false);
      }
    };
    loadInsights();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const handleSendMessage = async (queryToSend) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isChatLoading) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsChatLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiApi.chat(text, historyPayload);
      const assistantMessage = {
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: 'I could not retrieve an answer right now. Please verify your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Chat history cleared. What else would you like to know about your finances?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Assisted Financial Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Financial Assistant</h1>
          <p className="text-sm text-slate-400">
            Plain-language insights and grounded financial Q&amp;A powered strictly by your verified data.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Financial Insights Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Real-time Financial Insights</span>
        </h2>

        {insightsLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            Generating personalized financial insights...
          </div>
        ) : insights.length === 0 ? (
          <p className="text-xs text-slate-500">No insights available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((item, idx) => {
              const isPositive = item.type === 'POSITIVE';
              const isWarning = item.type === 'WARNING';
              const isTip = item.type === 'TIP';

              return (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`p-2 rounded-xl text-xs ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isWarning
                          ? 'bg-rose-500/10 text-rose-400'
                          : isTip
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {isPositive ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Lightbulb className="w-4 h-4" />
                      )}
                    </span>
                    {item.metric && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {item.metric}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Chat Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[520px] overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Grounded Finance Assistant</h3>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected to your real-time ledger
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Zero-Hallucination Grounding</span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-md leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs'
                      : 'bg-slate-800/90 border border-slate-700/60 text-slate-200 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isUser ? 'text-emerald-200 text-right' : 'text-slate-500'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {isChatLoading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-6 py-2 bg-slate-900/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-slate-500 shrink-0">Ask:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p)}
              disabled={isChatLoading}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-colors border border-slate-700/60 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about your income, expenses, budgets, or savings..."
              disabled={isChatLoading}
              className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isChatLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 disabled:opacity-40 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
