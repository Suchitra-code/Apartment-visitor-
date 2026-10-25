import React, { useState, useEffect } from 'react';
import { StatCard, Card, Badge, Button } from '../../components/ui';
import {
  Users,
  Building,
  ShieldCheck,
  Wrench,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/admin/metrics');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { metrics, visitorTrend, ticketsByCategory, ticketsByStatus, recentActivity } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Society Management Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time gate statistics, maintenance SLA progress, and resident occupancy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/admin/flats')}>
            Pending ({metrics.pendingApprovals})
          </Button>
          <Button size="sm" onClick={() => navigate('/maintenance')}>
            Manage Tickets
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Residents"
          value={metrics.totalResidents}
          subtitle={`Across ${metrics.totalFlats} apartments`}
          icon={Users}
          change="+8.4%"
          trend="up"
          color="indigo"
        />
        <StatCard
          title="Visitors Today"
          value={metrics.visitorsToday}
          subtitle="Gate check-ins logged"
          icon={ShieldCheck}
          change="+14.2%"
          trend="up"
          color="emerald"
        />
        <StatCard
          title="Open Tickets"
          value={metrics.openTickets}
          subtitle="Assigned & in-progress"
          icon={Wrench}
          change="-4.5%"
          trend="down"
          color="amber"
        />
        <StatCard
          title="Resolved This Month"
          value={metrics.resolvedTicketsCount}
          subtitle="98.2% SLA adherence"
          icon={CheckCircle2}
          change="+12.0%"
          trend="up"
          color="indigo"
        />
      </div>

      {/* Analytics Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-Day Visitor Traffic Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Visitor Traffic Trend</h3>
              <p className="text-xs text-slate-400">Total daily visitors over the past 30 days</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              Live Aggregate
            </span>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(str) => str.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#6366F1' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Tickets By Category Donut */}
        <Card className="p-6">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Tickets by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown of resident maintenance requests</p>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketsByCategory}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {ticketsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 justify-center">
            {ticketsByCategory.slice(0, 4).map((entry, idx) => (
              <span key={entry._id} className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                {entry._id} ({entry.count})
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Section: Tickets by Status & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Status Bar Chart */}
        <Card className="p-6">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Ticket Status Flow</h3>
          <p className="text-xs text-slate-400 mb-6">Distribution across resolution stages</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByStatus}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Activity Feed */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent Society Audit Trail</h3>
            <span className="text-xs text-slate-400">Real-time actions</span>
          </div>
          <div className="space-y-3.5">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((act) => (
                <div
                  key={act._id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {act.user?.name ? act.user.name.charAt(0) : 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {act.user?.name || 'System'} • <span className="font-medium text-slate-400">{act.action}</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">{act.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No recent logs recorded.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
