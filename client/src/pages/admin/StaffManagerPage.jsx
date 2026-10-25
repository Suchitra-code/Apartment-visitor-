import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import { Users, Plus, Phone, Wrench, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StaffManagerPage() {
  const [staff, setStaff] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    phone: '',
    specialization: 'Plumber',
    availability: 'Available',
  });

  const fetchStaff = async () => {
    try {
      const res = await api.get('/admin/staff');
      if (res.success) setStaff(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/staff', staffForm);
      if (res.success) {
        toast.success('Technician added!');
        setIsModalOpen(false);
        setStaffForm({ name: '', phone: '', specialization: 'Plumber', availability: 'Available' });
        fetchStaff();
      }
    } catch (err) {
      toast.error('Error adding staff');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await api.delete(`/admin/staff/${id}`);
      toast.success('Staff removed');
      fetchStaff();
    } catch (err) {
      toast.error('Error removing staff');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Staff & Specialized Vendors
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain electricians, plumbers, and technicians assigned to maintenance tickets.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Staff Member
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {staff.map((s) => (
          <Card key={s._id} className="p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {s.specialization}
                </span>
                <Badge variant={s.availability === 'Available' ? 'success' : 'default'}>
                  {s.availability}
                </Badge>
              </div>

              <h4 className="font-bold text-base text-slate-900 dark:text-white mt-3">{s.name}</h4>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone}
              </p>
              <p className="text-xs text-slate-400 mt-2">Active Workload: {s.activeTicketsCount || 0} tickets</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => handleDelete(s._id)}
                className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Staff Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Technician / Vendor">
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Vikram Singh"
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="+1 555-432-1001"
              value={staffForm.phone}
              onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Specialization</label>
            <select
              value={staffForm.specialization}
              onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="Plumber">Plumber</option>
              <option value="Electrician">Electrician</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Lift Technician">Lift Technician</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Security Officer">Security Officer</option>
              <option value="Pest Specialist">Pest Specialist</option>
              <option value="HVAC/General Maintenance">HVAC/General Maintenance</option>
            </select>
          </div>

          <Button type="submit" className="w-full mt-2">
            Save Staff Member
          </Button>
        </form>
      </Modal>
    </div>
  );
}
