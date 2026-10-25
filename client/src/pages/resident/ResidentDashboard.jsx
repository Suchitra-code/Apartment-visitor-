import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { ShieldCheck, Plus, QrCode, Wrench, Bell, ArrowRight, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function ResidentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [visitors, setVisitors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [visRes, tickRes, notRes] = await Promise.all([
          api.get('/visitors?limit=5'),
          api.get('/tickets?limit=5'),
          api.get('/admin/notices'),
        ]);

        if (visRes.success) setVisitors(visRes.data.visitors);
        if (tickRes.success) setTickets(tickRes.data.tickets);
        if (notRes.success) setNotices(notRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
              Apartment {user?.flat ? `Block ${user.flat.block || 'A'} - Flat ${user.flat.number || '101'}` : 'Resident'}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-3">Welcome home, {user?.name}!</h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-lg">
              Manage pre-approved visitor passes, view gate entries, and track maintenance repairs in real-time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/visitors?action=pre-approve')}
              className="bg-white text-indigo-700 hover:bg-slate-100 border-none shadow-md font-bold"
            >
              <QrCode className="w-4 h-4 mr-2" /> Pre-approve Visitor
            </Button>
            <Button
              onClick={() => navigate('/maintenance?action=create')}
              className="bg-indigo-950/60 hover:bg-indigo-950 text-white border border-white/20 shadow-md font-bold"
            >
              <Wrench className="w-4 h-4 mr-2" /> Raise Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* Emergency & Pinned Notices Banner */}
      {notices.some((n) => n.category === 'Emergency' || n.isPinned) && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-start gap-3">
          <Bell className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="danger">Important Notice</Badge>
              <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
                {notices.find((n) => n.category === 'Emergency' || n.isPinned)?.title}
              </span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
              {notices.find((n) => n.category === 'Emergency' || n.isPinned)?.body}
            </p>
          </div>
        </div>
      )}

      {/* Two Column Grid: Upcoming Visitors + Open Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visitors Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent & Expected Visitors</h3>
              <p className="text-xs text-slate-400">Pass clearance statuses for your flat</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/visitors')}>
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visitors.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No visitor records yet.</p>
            ) : (
              visitors.map((v) => (
                <div key={v._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{v.name}</p>
                    <p className="text-xs text-slate-400">
                      Pass: <span className="font-mono font-bold text-indigo-600">{v.passCode}</span> • Purpose:{' '}
                      {v.purpose}
                    </p>
                  </div>
                  <Badge
                    variant={
                      v.status === 'Checked-In'
                        ? 'success'
                        : v.status === 'Pre-approved'
                        ? 'primary'
                        : v.status === 'Denied'
                        ? 'danger'
                        : 'default'
                    }
                  >
                    {v.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Maintenance Tickets Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">My Maintenance Tickets</h3>
              <p className="text-xs text-slate-400">Work status and technician assignments</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/maintenance')}>
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No active maintenance requests.</p>
            ) : (
              tickets.map((t) => (
                <div key={t._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</p>
                    <p className="text-xs text-slate-400">
                      #{t.ticketNumber} • {t.category} • Priority: {t.priority}
                    </p>
                  </div>
                  <Badge
                    variant={
                      t.status === 'Resolved' || t.status === 'Closed'
                        ? 'success'
                        : t.status === 'In Progress'
                        ? 'warning'
                        : 'primary'
                    }
                  >
                    {t.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
