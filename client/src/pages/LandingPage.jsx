import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import {
  ShieldCheck,
  QrCode,
  Wrench,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-500/20">
              AH
            </div>
            <span className="font-extrabold text-lg tracking-tight">ApartmentHub</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-900">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Explore Live Demo</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-600/30 via-violet-600/20 to-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Gen MERN Society Operating System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
            Gate security and maintenance,{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
              elevated to an art.
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate paper logbooks. Pre-approve visitor passes with instant QR verification, track repair work on dynamic Kanban boards, and orchestrate residential communities with zero friction.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-base px-8 py-3.5 font-bold shadow-glow">
                Launch Live Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full text-base px-8 py-3.5 font-bold">
                Register Resident Flat
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Core Roles Showcase */}
      <section className="py-20 border-t border-slate-900 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">Tailored for Every Society Persona</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Role-based access control grants distinct, optimized workflows for residents, security guards, and society management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Resident Card */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Resident Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Generate 6-digit visitor passes with QR codes, get real-time walk-in gate approval prompts, and report apartment plumbing or electrical repairs in 3 taps.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ Instant visitor pre-approval & QR</li>
                <li className="flex items-center gap-2">✓ In-app gate walk-in approval</li>
                <li className="flex items-center gap-2">✓ Star rating & technician feedback</li>
              </ul>
            </div>

            {/* Guard Station Card */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Gatekeeper Station</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Touch-first tablet and mobile interface engineered for fast 10-second pass code verification, blacklist prevention, and walk-in camera capture.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ 6-Digit pass code check-in</li>
                <li className="flex items-center gap-2">✓ Automatic stay duration tracking</li>
                <li className="flex items-center gap-2">✓ Active inside premises counter</li>
              </ul>
            </div>

            {/* Admin Card */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 transition-all duration-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Society Administration</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Complete control over apartment blocks, registration approvals, vendor technician assignments, maintenance Kanban boards, and notice publishing.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ Drag & drop maintenance Kanban</li>
                <li className="flex items-center gap-2">✓ Flat & resident directory approval</li>
                <li className="flex items-center gap-2">✓ Influx analytics & CSV logs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>ApartmentHub – Production-Grade Full-Stack MERN Architecture.</p>
        <p className="mt-1">Designed with React 18, Vite, Tailwind CSS, Node.js & MongoDB.</p>
      </footer>
    </div>
  );
}
