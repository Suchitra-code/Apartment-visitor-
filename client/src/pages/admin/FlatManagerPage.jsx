import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import { Building2, Plus, CheckCircle, XCircle, Users, Search } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function FlatManagerPage() {
  const [flats, setFlats] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('flats'); // 'flats' or 'pending'
  const [search, setSearch] = useState('');
  const [isAddFlatOpen, setIsAddFlatOpen] = useState(false);
  const [flatForm, setFlatForm] = useState({
    block: 'A',
    floor: 1,
    number: '',
    type: '2BHK',
    status: 'vacant',
  });

  const fetchData = async () => {
    try {
      const [fRes, pRes] = await Promise.all([
        api.get('/admin/flats'),
        api.get('/admin/registrations/pending'),
      ]);
      if (fRes.success) setFlats(fRes.data);
      if (pRes.success) setPendingUsers(pRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (id, status) => {
    try {
      const res = await api.put(`/admin/registrations/${id}`, { status });
      if (res.success) {
        toast.success(`Resident registration ${status}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleAddFlat = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/flats', flatForm);
      if (res.success) {
        toast.success('Flat added successfully!');
        setIsAddFlatOpen(false);
        setFlatForm({ block: 'A', floor: 1, number: '', type: '2BHK', status: 'vacant' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Error creating flat');
    }
  };

  const filteredFlats = flats.filter((f) =>
    f.number.toLowerCase().includes(search.toLowerCase()) ||
    f.block.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Flats & Resident Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage society units, occupancy status, and approve new resident registrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsAddFlatOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Flat Unit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('flats')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'flats'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          All Flats ({flats.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Pending Resident Approvals
          {pendingUsers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
              {pendingUsers.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'flats' ? (
        <div className="space-y-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search flat number or block..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFlats.map((flat) => (
              <Card key={flat._id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                    {flat.block}-{flat.number}
                  </span>
                  <Badge variant={flat.status === 'occupied' ? 'success' : 'default'}>
                    {flat.status}
                  </Badge>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>Floor: {flat.floor} • Type: {flat.type}</p>
                  <p className="truncate">
                    <strong>Residents:</strong>{' '}
                    {flat.residents?.length > 0
                      ? flat.residents.map((r) => r.name).join(', ')
                      : 'Vacant unit'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Pending Approvals */
        <Card className="overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Resident</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Flat Applied</th>
                <th className="p-4">Ownership Type</th>
                <th className="p-4 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No registrations currently awaiting approval.
                  </td>
                </tr>
              ) : (
                pendingUsers.map((u) => (
                  <tr key={u._id}>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="p-4 text-slate-500">
                      <p>{u.email}</p>
                      <p className="text-[11px]">{u.phone}</p>
                    </td>
                    <td className="p-4 font-semibold">
                      {u.flat ? `Block ${u.flat.block}-${u.flat.number}` : 'Unassigned'}
                    </td>
                    <td className="p-4 capitalize">{u.residentType}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleDecision(u._id, 'approved')}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDecision(u._id, 'rejected')}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add Flat Modal */}
      <Modal
        isOpen={isAddFlatOpen}
        onClose={() => setIsAddFlatOpen(false)}
        title="Add New Apartment Flat"
      >
        <form onSubmit={handleAddFlat} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Block</label>
              <input
                type="text"
                required
                placeholder="A"
                value={flatForm.block}
                onChange={(e) => setFlatForm({ ...flatForm, block: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Floor</label>
              <input
                type="number"
                required
                min="0"
                value={flatForm.floor}
                onChange={(e) => setFlatForm({ ...flatForm, floor: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Flat Number</label>
              <input
                type="text"
                required
                placeholder="101"
                value={flatForm.number}
                onChange={(e) => setFlatForm({ ...flatForm, number: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Unit Type</label>
              <select
                value={flatForm.type}
                onChange={(e) => setFlatForm({ ...flatForm, type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
                <option value="3BHK">3BHK</option>
                <option value="4BHK">4BHK</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2">
            Create Flat
          </Button>
        </form>
      </Modal>
    </div>
  );
}
