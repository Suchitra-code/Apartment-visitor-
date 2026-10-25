import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [demoToken, setDemoToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResetDone, setIsResetDone] = useState(false);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.success) {
        setDemoToken(res.data.demoResetToken);
        toast.success('Reset token generated!');
      }
    } catch (err) {
      toast.error(err.message || 'Error requesting reset token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token: demoToken,
        newPassword,
      });
      if (res.success) {
        setIsResetDone(true);
        toast.success('Password updated successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Error updating password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Reset Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulated password recovery workflow for production & demo.
          </p>
        </div>

        {isResetDone ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Your password has been successfully reset!
            </p>
            <Link to="/login">
              <Button className="w-full mt-2">Sign In with New Password</Button>
            </Link>
          </div>
        ) : !demoToken ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Enter your account email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="resident@apartmenthub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <Button type="submit" className="w-full py-2.5" isLoading={isLoading}>
              Generate Reset Token
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <p className="font-bold">Dev Demo Token Captured:</p>
              <p className="font-mono break-all mt-1">{demoToken}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Enter New Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button type="submit" className="w-full py-2.5" isLoading={isLoading}>
              Confirm Password Reset
            </Button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            ← Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
