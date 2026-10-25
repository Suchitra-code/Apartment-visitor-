import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import { ShieldCheck, LogIn, LogOut, UserPlus, Users, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function GuardDashboard() {
  const [passInput, setPassInput] = useState('');
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [flats, setFlats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Walk-in modal state
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInData, setWalkInData] = useState({
    name: '',
    phone: '',
    purpose: 'delivery',
    flatId: '',
    vehicleNumber: '',
    guardNotes: '',
  });

  const fetchData = async () => {
    try {
      const [actRes, flatRes] = await Promise.all([
        api.get('/visitors/active'),
        api.get('/admin/flats'),
      ]);
      if (actRes.success) setActiveVisitors(actRes.data);
      if (flatRes.success) {
        setFlats(flatRes.data);
        if (flatRes.data.length > 0 && !walkInData.flatId) {
          setWalkInData((prev) => ({ ...prev, flatId: flatRes.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s auto refresh at the gate
    return () => clearInterval(interval);
  }, []);

  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    if (!passInput.trim()) {
      toast.error('Please enter 6-digit pass code');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/visitors/check-in', { passCode: passInput.trim() });
      if (res.success) {
        toast.success(`Access Cleared! Visitor ${res.data.name} checked in.`);
        setPassInput('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async (visitorId) => {
    try {
      const res = await api.post('/visitors/check-out', { visitorId });
      if (res.success) {
        toast.success(`Visitor checked out (Stay: ${res.data.durationMinutes || 0} mins)`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Check out failed');
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/visitors/walk-in', walkInData);
      if (res.success) {
        toast.success('Walk-in visitor recorded! Sent to resident for approval.');
        setIsWalkInModalOpen(false);
        setWalkInData({
          name: '',
          phone: '',
          purpose: 'delivery',
          flatId: flats[0]?._id || '',
          vehicleNumber: '',
          guardNotes: '',
        });
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Error recording walk-in');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Fast Gate Action */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ● Gatekeeper Active
            </span>
            <h1 className="text-3xl font-black tracking-tight">Security Gate Terminal</h1>
            <p className="text-slate-400 text-sm max-w-md">
              Instant pass verification, vehicle logs, and walk-in resident authorization.
            </p>
          </div>

          {/* Touch-Friendly Fast Pass Code Bar */}
          <form onSubmit={handleQuickCheckIn} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <input
              type="text"
              placeholder="ENTER 6-DIGIT PASS CODE"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value.toUpperCase())}
              className="px-5 py-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-white font-mono font-bold tracking-wider placeholder-slate-500 text-center sm:text-left text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
            <Button
              type="submit"
              variant="success"
              size="lg"
              className="py-3.5 px-6 font-bold"
              isLoading={isLoading}
            >
              <LogIn className="w-5 h-5 mr-2" /> Check-In Pass
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setIsWalkInModalOpen(true)}
              className="py-3.5 px-6 font-bold"
            >
              <UserPlus className="w-5 h-5 mr-2" /> Walk-In Entry
            </Button>
          </form>
        </div>
      </div>

      {/* Visitors Currently Inside Gate Station */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Visitors Inside Premises</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                {activeVisitors.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Currently checked-in guests, cabs & delivery personnel</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            Refresh
          </Button>
        </div>

        {activeVisitors.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No visitors currently inside.</p>
            <p className="text-xs text-slate-400">All guests are checked out or awaiting arrival.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeVisitors.map((vis) => (
              <div
                key={vis._id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {vis.purpose}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">#{vis.passCode}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{vis.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Destination: Flat {vis.flat ? `${vis.flat.block}-${vis.flat.number}` : 'N/A'} (Host: {vis.host?.name || 'Resident'})
                  </p>
                  {vis.vehicleNumber && (
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1">
                      🚗 {vis.vehicleNumber}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Entered: {new Date(vis.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  className="w-full mt-2 font-bold"
                  onClick={() => handleCheckOut(vis._id)}
                >
                  <LogOut className="w-4 h-4 mr-1.5" /> Check Out
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Walk-in Visitor Modal */}
      <Modal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        title="Register Walk-In Gate Entry"
        description="Fill visitor details to request immediate in-app authorization from the flat resident."
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Visitor Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Johnathan Smith"
              value={walkInData.name}
              onChange={(e) => setWalkInData({ ...walkInData, name: e.target.value })}
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
                value={walkInData.phone}
                onChange={(e) => setWalkInData({ ...walkInData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Purpose
              </label>
              <select
                value={walkInData.purpose}
                onChange={(e) => setWalkInData({ ...walkInData, purpose: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="delivery">Delivery</option>
                <option value="guest">Guest</option>
                <option value="cab">Cab / Taxi</option>
                <option value="service">Service / Tech</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Select Destination Flat
              </label>
              <select
                value={walkInData.flatId}
                onChange={(e) => setWalkInData({ ...walkInData, flatId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {flats.map((f) => (
                  <option key={f._id} value={f._id}>
                    Block {f.block}-{f.number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Vehicle No. (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. KA-01-AB-1234"
                value={walkInData.vehicleNumber}
                onChange={(e) => setWalkInData({ ...walkInData, vehicleNumber: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsWalkInModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Send Approval Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
