import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import {
  ShieldCheck,
  Plus,
  Download,
  Search,
  Filter,
  QrCode,
  Check,
  X,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

export default function VisitorManagerPage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();

  const [visitors, setVisitors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Pre-approve Modal
  const [isPreApproveOpen, setIsPreApproveOpen] = useState(searchParams.get('action') === 'pre-approve');
  const [preApproveForm, setPreApproveForm] = useState({
    name: '',
    phone: '',
    purpose: 'guest',
    vehicleNumber: '',
    peopleCount: 1,
    expectedAt: new Date().toISOString().slice(0, 16),
  });

  // Generated Pass Modal
  const [generatedPass, setGeneratedPass] = useState(null);

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/visitors?page=${pagination.page}&status=${statusFilter}&search=${searchQuery}`
      );
      if (res.success) {
        setVisitors(res.data.visitors);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [pagination.page, statusFilter, searchQuery]);

  const handlePreApproveSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/visitors/pre-approve', preApproveForm);
      if (res.success) {
        toast.success('Visitor pre-approved!');
        setIsPreApproveOpen(false);
        setGeneratedPass(res.data);
        fetchVisitors();
      }
    } catch (err) {
      toast.error(err.message || 'Error pre-approving visitor');
    }
  };

  const handleDecision = async (id, decision) => {
    try {
      const res = await api.put(`/visitors/${id}/decision`, { decision });
      if (res.success) {
        toast.success(`Visitor ${decision}!`);
        fetchVisitors();
      }
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleExportCSV = () => {
    window.open('/api/v1/visitors/export/csv', '_blank');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Visitor Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pre-approve guests, track real-time gate entries, and issue QR digital passes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export CSV
            </Button>
          )}
          {(user?.role === 'resident' || user?.role === 'admin') && (
            <Button size="sm" onClick={() => setIsPreApproveOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Pre-Approve Visitor
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search visitor name, phone, pass code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['all', 'Pre-approved', 'Pending Approval', 'Checked-In', 'Checked-Out'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st === 'all' ? 'All Visitors' : st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Visitors List / Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Visitor</th>
                <th className="p-4">Pass Code</th>
                <th className="p-4">Purpose</th>
                <th className="p-4">Destination Flat</th>
                <th className="p-4">Status</th>
                <th className="p-4">Check-In / Out</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    Loading visitors log...
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No visitor records found matching criteria.
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{v.name}</p>
                      <p className="text-slate-400 text-[11px]">{v.phone}</p>
                      {v.vehicleNumber && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">🚗 {v.vehicleNumber}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-md">
                        {v.passCode}
                      </span>
                    </td>
                    <td className="p-4 capitalize text-slate-600 dark:text-slate-300">{v.purpose}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {v.flat ? `Flat ${v.flat.block}-${v.flat.number}` : 'N/A'}
                      </p>
                      <p className="text-[11px] text-slate-400">{v.host?.name || 'Resident'}</p>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          v.status === 'Checked-In'
                            ? 'success'
                            : v.status === 'Pre-approved'
                            ? 'primary'
                            : v.status === 'Pending Approval'
                            ? 'warning'
                            : v.status === 'Denied'
                            ? 'danger'
                            : 'default'
                        }
                      >
                        {v.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {v.checkInAt ? (
                        <div>
                          <p>In: {new Date(v.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          {v.checkOutAt && (
                            <p className="text-[11px]">
                              Out: {new Date(v.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({v.durationMinutes}m)
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Not arrived</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {v.status === 'Pending Approval' &&
                        (user?.role === 'resident' || user?.role === 'admin') && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDecision(v._id, 'Approved')}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold"
                              title="Approve Visitor"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDecision(v._id, 'Denied')}
                              className="p-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold"
                              title="Deny Visitor"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      {v.status === 'Pre-approved' && (
                        <button
                          onClick={() => setGeneratedPass(v)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          View Pass
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pre-approve Visitor Modal */}
      <Modal
        isOpen={isPreApproveOpen}
        onClose={() => setIsPreApproveOpen(false)}
        title="Pre-Approve Visitor Pass"
        description="Generate an entry QR code & 6-digit access code for your expected guest or delivery."
      >
        <form onSubmit={handlePreApproveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Visitor Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Jenkins"
              value={preApproveForm.name}
              onChange={(e) => setPreApproveForm({ ...preApproveForm, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                placeholder="+1 555-019-2831"
                value={preApproveForm.phone}
                onChange={(e) => setPreApproveForm({ ...preApproveForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Purpose
              </label>
              <select
                value={preApproveForm.purpose}
                onChange={(e) => setPreApproveForm({ ...preApproveForm, purpose: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="guest">Guest</option>
                <option value="delivery">Delivery</option>
                <option value="cab">Cab / Taxi</option>
                <option value="service">Home Service</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Vehicle No. (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. KA-01-AB-1234"
                value={preApproveForm.vehicleNumber}
                onChange={(e) => setPreApproveForm({ ...preApproveForm, vehicleNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                No. of People
              </label>
              <input
                type="number"
                min="1"
                value={preApproveForm.peopleCount}
                onChange={(e) => setPreApproveForm({ ...preApproveForm, peopleCount: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsPreApproveOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Generate Pass</Button>
          </div>
        </form>
      </Modal>

      {/* Generated Digital Pass Modal */}
      {generatedPass && (
        <Modal
          isOpen={!!generatedPass}
          onClose={() => setGeneratedPass(null)}
          title="Digital Visitor Pass"
          description="Share this pass or QR code with your guest for fast gate entry."
          maxWidth="max-w-sm"
        >
          <div className="space-y-6 text-center">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
              <div className="inline-block p-3 bg-white rounded-2xl shadow-md mb-4">
                <QRCodeSVG value={generatedPass.passCode} size={150} />
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Fast Pass Code</p>
              <p className="text-3xl font-black font-mono tracking-widest text-indigo-600 dark:text-indigo-400 mt-1">
                {generatedPass.passCode}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-left text-xs space-y-1">
                <p>
                  <strong className="text-slate-700 dark:text-slate-300">Visitor:</strong> {generatedPass.name}
                </p>
                <p>
                  <strong className="text-slate-700 dark:text-slate-300">Purpose:</strong> {generatedPass.purpose}
                </p>
                <p>
                  <strong className="text-slate-700 dark:text-slate-300">Flat:</strong>{' '}
                  {generatedPass.flat ? `${generatedPass.flat.block}-${generatedPass.flat.number}` : 'Your flat'}
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                window.print();
              }}
            >
              Print / Save Pass
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
