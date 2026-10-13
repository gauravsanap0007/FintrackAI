import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Bot,
  PieChart,
  Target,
  PiggyBank,
  CheckCircle,
  Code2,
  Lock,
  Layers,
  ChevronRight,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-xl shadow-md shadow-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              FinTrack <span className="text-emerald-400">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/demo"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors"
            >
              Explore Demo
            </Link>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#10b98115,transparent_50%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-xs animate-in fade-in zoom-in duration-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Assisted Personal Financial Management</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Understand your money. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Plan your future.
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            FinTrack AI unifies your bank accounts, cash flows, and category budgets with
            server-side financial precision and grounded AI natural language assistance.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <span>Start Tracking Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/demo"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all shadow-md"
            >
              <span>Explore Live Demo</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Academic Badge */}
          <div className="pt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Academic Capstone &amp; Production-Ready Portfolio Architecture</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-20 bg-slate-900/50 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Architected for Financial Accuracy
            </h2>
            <p className="text-sm text-slate-400">
              Built on strict mathematical calculations with zero hallucination. Django computes all numbers; the AI only explains and extracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-xl space-y-4 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Dynamic Analytics &amp; Trends</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual multi-month cash flow curves, net savings rates, and category donut breakdowns driven strictly by live ORM ledger aggregates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-xl space-y-4 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Natural Language "Add with AI"</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Type or paste everyday transaction notes. FinTrack extracts amount, merchant, and category, and requires explicit user review before saving.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-xl space-y-4 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <PiggyBank className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Category Budgets &amp; Goals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-tier utilization safeguards (Safe &lt;70%, Warning 70-90%, Danger &gt;90%) with target milestone tracking and progress bars.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Architecture Highlights */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Trust Data Isolation</span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
              Every data point is locked to your account.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Designed with enterprise security best practices:
            </p>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Every query is rigorously scoped to <code>request.user</code></span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI service receives sanitized summaries — never direct DB write permissions</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Stateful JWT tokens with automatic refresh and blacklisting on logout</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Atomic database transactions prevent balance corruption or race conditions</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
              Full Technology Stack
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <p className="text-emerald-400 font-bold">Frontend</p>
                <p className="text-slate-300 mt-1">React + Vite, Tailwind CSS, Recharts, Lucide</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <p className="text-emerald-400 font-bold">Backend</p>
                <p className="text-slate-300 mt-1">Python, Django 6, Django REST Framework, SimpleJWT</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <p className="text-emerald-400 font-bold">Database</p>
                <p className="text-slate-300 mt-1">PostgreSQL 16 &amp; SQLite runner with ORM locking</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <p className="text-emerald-400 font-bold">AI Layer</p>
                <p className="text-slate-300 mt-1">Isolated LLM Service with deterministic fallback</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Ready to take command of your finances?
          </h2>
          <p className="text-slate-400 text-sm">
            Join FinTrack AI today or try our interactive demo dashboard.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Create Free Account
            </Link>
            <Link
              to="/demo"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              Open Demo Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-900 text-center text-xs text-slate-600">
        <p>© 2026 FinTrack AI. Built as an academic portfolio project.</p>
      </footer>
    </div>
  );
}
