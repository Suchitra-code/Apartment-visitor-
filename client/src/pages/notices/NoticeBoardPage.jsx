import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import { Bell, Plus, Pin, AlertCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function NoticeBoardPage() {
  const { user } = useAuthStore();
  const [notices, setNotices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    body: '',
    category: 'General',
    isPinned: false,
  });

  const fetchNotices = async () => {
    try {
      const res = await api.get('/admin/notices');
      if (res.success) setNotices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/notices', noticeForm);
      if (res.success) {
        toast.success('Notice published!');
        setIsModalOpen(false);
        setNoticeForm({ title: '', body: '', category: 'General', isPinned: false });
        fetchNotices();
      }
    } catch (err) {
      toast.error('Error posting notice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/admin/notices/${id}`);
      toast.success('Notice deleted');
      fetchNotices();
    } catch (err) {
      toast.error('Error deleting notice');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Community Notice Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official society circulars, scheduled power/water outages, and event announcements.
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Publish Notice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notices.map((n) => (
          <Card
            key={n._id}
            className={`p-6 flex flex-col justify-between space-y-4 ${
              n.category === 'Emergency'
                ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
                : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    n.category === 'Emergency'
                      ? 'danger'
                      : n.category === 'Maintenance'
                      ? 'warning'
                      : n.category === 'Event'
                      ? 'success'
                      : 'primary'
                  }
                >
                  {n.category}
                </Badge>
                {n.isPinned && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                    <Pin className="w-3.5 h-3.5 fill-amber-500" /> Pinned
                  </span>
                )}
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-3">{n.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {n.body}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>{new Date(n.createdAt).toLocaleDateString()}</span>
              {user?.role === 'admin' && (
                <button
                  onClick={() => handleDelete(n._id)}
                  className="text-rose-500 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Publish Notice Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publish Circular Notice">
        <form onSubmit={handleCreateNotice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled Lift Maintenance"
              value={noticeForm.title}
              onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category</label>
              <select
                value={noticeForm.category}
                onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="General">General</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Event">Event</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div className="flex items-center pt-5">
              <input
                type="checkbox"
                id="pinned-toggle"
                checked={noticeForm.isPinned}
                onChange={(e) => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <label htmlFor="pinned-toggle" className="ml-2 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                Pin to top
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Content Body</label>
            <textarea
              rows={4}
              required
              placeholder="Enter full notice announcement..."
              value={noticeForm.body}
              onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <Button type="submit" className="w-full mt-2">
            Publish Notice
          </Button>
        </form>
      </Modal>
    </div>
  );
}
