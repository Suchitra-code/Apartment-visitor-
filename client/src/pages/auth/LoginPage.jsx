import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button, Card } from '../../components/ui';
import { ShieldCheck, Sparkles, Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      toast.success('Welcome back!');
      if (res.role === 'admin') navigate('/admin/dashboard');
      else if (res.role === 'guard') navigate('/guard/dashboard');
      else navigate('/resident/dashboard');
    } else {
      toast.error(res.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left Branding Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-950 p-12 flex-col justify-between overflow-hidden text-white">
        {/* Glow ambient circle */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xl text-white">
            AH
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">ApartmentHub</h2>
            <p className="text-xs text-indigo-300">Intelligent Society Management</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Next-Gen Visitor Clearance & Maintenance SLA</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Security at the gate, serenity inside your home.
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Instant 6-digit QR pre-approvals, live walk-in gate authorization, drag-and-drop maintenance Kanban, and role-based society governance in one unified platform.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-indigo-300">Gate Accountability</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">&lt; 15s</p>
              <p className="text-xs text-indigo-300">Fast QR Check-in</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">4.9/5</p>
              <p className="text-xs text-indigo-300">Resident Satisfaction</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-300/80">
          © 2026 ApartmentHub Technologies Inc. Built for Premier Residential Communities.
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sign in to your portal
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Enter your registered email address and password to log in.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@apartmenthub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
              />
              <label htmlFor="remember-me" className="ml-2 text-xs text-slate-600 dark:text-slate-400">
                Remember me for 30 days
              </label>
            </div>

            <Button type="submit" size="lg" className="w-full py-3 text-base" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Resident moving in?{' '}
            <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Register Flat Access
            </Link>
          </p>

          <div className="pt-4 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              ← Return to Home Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
