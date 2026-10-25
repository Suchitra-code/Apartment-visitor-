import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  UserCheck,
  Star,
  Layers,
  List,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const STATUS_COLUMNS = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(searchParams.get('action') === 'create');

  // Rating Modal
  const [ratingModalTicket, setRatingModalTicket] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');

  // Ticket Form
  const [ticketForm, setTicketForm] = useState({
    title: '',
    category: 'Plumbing',
    priority: 'Medium',
    description: '',
    preferredSlot: 'Morning (9 AM - 12 PM)',
  });

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      if (res.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStaff = async () => {
    if (user?.role === 'admin') {
      try {
        const res = await api.get('/admin/staff');
        if (res.success) setStaffList(res.data);
      } catch (err) {}
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStaff();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/tickets', ticketForm);
      if (res.success) {
        toast.success('Maintenance ticket raised!');
        setIsCreateModalOpen(false);
        setTicketForm({
          title: '',
          category: 'Plumbing',
          priority: 'Medium',
          description: '',
          preferredSlot: 'Morning (9 AM - 12 PM)',
        });
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Error raising ticket');
    }
  };

  const handleStatusChange = async (ticketId, nextStatus) => {
    try {
      const res = await api.put(`/tickets/${ticketId}`, { status: nextStatus });
      if (res.success) {
        toast.success(`Ticket status updated to ${nextStatus}`);
        fetchTickets();
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(res.data);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error updating status');
    }
  };

  const handleAssignStaff = async (ticketId, staffId) => {
    try {
      const res = await api.put(`/tickets/${ticketId}`, { assignedToId: staffId });
      if (res.success) {
        toast.success('Technician assigned successfully');
        fetchTickets();
      }
    } catch (err) {
      toast.error('Assignment error');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/tickets/${selectedTicket._id}/comments`, { message: commentText });
      if (res.success) {
        setSelectedTicket((prev) => ({
          ...prev,
          comments: res.data,
        }));
        setCommentText('');
        fetchTickets();
      }
    } catch (err) {
      toast.error('Comment error');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/tickets/${ratingModalTicket._id}/feedback`, {
        rating: ratingScore,
        feedback: ratingFeedback,
      });
      if (res.success) {
        toast.success('Thank you for rating our service!');
        setRatingModalTicket(null);
        fetchTickets();
      }
    } catch (err) {
      toast.error('Error submitting feedback');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Maintenance Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time Kanban workflow, SLA timeline audits, and technician assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>

          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Raise Request
          </Button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((colStatus) => {
            const colTickets = tickets.filter((t) => t.status === colStatus);
            return (
              <div key={colStatus} className="bg-slate-100/70 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col min-w-[240px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {colStatus}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {colTickets.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTickets.map((t) => (
                    <Card
                      key={t._id}
                      className="p-3.5 cursor-pointer hover:border-indigo-500 transition space-y-2.5"
                      onClick={() => setSelectedTicket(t)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400">#{t.ticketNumber}</span>
                        <Badge
                          variant={
                            t.priority === 'Urgent'
                              ? 'danger'
                              : t.priority === 'High'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {t.priority}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">{t.title}</h4>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Flat: {t.flat ? `${t.flat.block}-${t.flat.number}` : 'N/A'} • {t.category}
                      </p>

                      {t.assignedTo && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span className="truncate">{t.assignedTo.name}</span>
                        </div>
                      )}

                      {/* Resident Rate Button if Resolved */}
                      {user?.role === 'resident' && t.status === 'Resolved' && !t.rating && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs py-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRatingModalTicket(t);
                          }}
                        >
                          <Star className="w-3.5 h-3.5 mr-1" /> Rate Service
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Ticket</th>
                <th className="p-4">Category</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Flat</th>
                <th className="p-4">Assigned To</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tickets.map((t) => (
                <tr
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer"
                >
                  <td className="p-4">
                    <p className="font-bold text-slate-900 dark:text-white">{t.title}</p>
                    <p className="text-[11px] font-mono text-slate-400">#{t.ticketNumber}</p>
                  </td>
                  <td className="p-4">{t.category}</td>
                  <td className="p-4">
                    <Badge variant={t.priority === 'Urgent' ? 'danger' : 'default'}>{t.priority}</Badge>
                  </td>
                  <td className="p-4">{t.flat ? `${t.flat.block}-${t.flat.number}` : 'N/A'}</td>
                  <td className="p-4">{t.assignedTo?.name || 'Unassigned'}</td>
                  <td className="p-4">
                    <Badge variant={t.status === 'Resolved' || t.status === 'Closed' ? 'success' : 'primary'}>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm">
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Ticket Details & Timeline Drawer Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket #${selectedTicket.ticketNumber}`}
          description={`Raised on ${new Date(selectedTicket.createdAt).toLocaleDateString()}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedTicket.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {selectedTicket.description}
              </p>
            </div>

            {/* Admin Controls */}
            {user?.role === 'admin' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Update Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket._id, e.target.value)}
                    className="w-full text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    {STATUS_COLUMNS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Assign Technician</label>
                  <select
                    value={selectedTicket.assignedTo?._id || ''}
                    onChange={(e) => handleAssignStaff(selectedTicket._id, e.target.value)}
                    className="w-full text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Status Timeline</h4>
              <div className="space-y-3">
                {selectedTicket.timeline?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {item.status} <span className="text-[11px] font-normal text-slate-400">({new Date(item.timestamp).toLocaleString()})</span>
                      </p>
                      {item.notes && <p className="text-slate-500 text-[11px]">{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment Thread */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Communication Thread
              </h4>
              <div className="space-y-2.5 max-h-48 overflow-y-auto mb-4">
                {selectedTicket.comments?.length === 0 ? (
                  <p className="text-xs text-slate-400">No notes or comments yet.</p>
                ) : (
                  selectedTicket.comments?.map((c) => (
                    <div key={c._id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{c.sender?.name || 'User'}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">{c.message}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Post comment or note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <Button type="submit" size="sm">
                  Send
                </Button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Raise Maintenance Ticket"
        description="Submit a repair or service request to the society maintenance desk."
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Issue Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bathroom faucet leaking continuously"
              value={ticketForm.title}
              onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Lift">Lift</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Security">Security</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Pest Control">Pest Control</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide specific details about the issue..."
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Resident Rating Feedback Modal */}
      {ratingModalTicket && (
        <Modal
          isOpen={!!ratingModalTicket}
          onClose={() => setRatingModalTicket(null)}
          title="Rate Maintenance Service"
          description={`Please rate the resolution for Ticket #${ratingModalTicket.ticketNumber}`}
        >
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Service Rating (1 to 5 Stars)
              </label>
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    className="p-2 text-2xl hover:scale-125 transition"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingScore ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Feedback Remarks
              </label>
              <textarea
                rows={3}
                placeholder="How was the technician's professionalism and promptness?"
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <Button type="submit" className="w-full">
              Submit Review & Close Ticket
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
