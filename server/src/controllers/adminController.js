const Flat = require('../models/Flat');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const Visitor = require('../models/Visitor');
const Ticket = require('../models/Ticket');
const ActivityLog = require('../models/ActivityLog');
const { asyncHandler, sendResponse } = require('../utils/response');

// ==================== FLATS & RESIDENTS ====================

const getFlats = asyncHandler(async (req, res) => {
  const flats = await Flat.find().populate('residents', 'name email phone avatar residentType').sort({ block: 1, number: 1 });
  return sendResponse(res, 200, true, 'Flats fetched', flats);
});

const createFlat = asyncHandler(async (req, res) => {
  const { block, floor, number, type, status } = req.body;
  const flat = await Flat.create({ block, floor, number, type, status });
  return sendResponse(res, 201, true, 'Flat created successfully', flat);
});

const updateFlat = asyncHandler(async (req, res) => {
  const flat = await Flat.findByIdAndUpdate(req.params.id, req.body, { new: true });
  return sendResponse(res, 200, true, 'Flat updated successfully', flat);
});

const deleteFlat = asyncHandler(async (req, res) => {
  await Flat.findByIdAndDelete(req.params.id);
  return sendResponse(res, 200, true, 'Flat removed');
});

// Resident approval/rejection
const getPendingRegistrations = asyncHandler(async (req, res) => {
  const pending = await User.find({ status: 'pending', role: 'resident' })
    .populate('flat')
    .sort({ createdAt: -1 });
  return sendResponse(res, 200, true, 'Pending resident approvals', pending);
});

const decideRegistration = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  const user = await User.findById(req.params.id);

  if (!user) {
    return sendResponse(res, 404, false, 'User not found.');
  }

  user.status = status;
  await user.save();

  await Notification.create({
    recipient: user._id,
    type: 'registration_status',
    title: `Registration ${status === 'approved' ? 'Approved' : 'Rejected'}`,
    message: status === 'approved'
      ? 'Congratulations! Your resident access to ApartmentHub has been approved.'
      : 'Your registration request was not approved. Please contact society management.',
  });

  return sendResponse(res, 200, true, `Resident registration ${status}`, user);
});

const getResidentsDirectory = asyncHandler(async (req, res) => {
  const residents = await User.find({ role: 'resident' })
    .populate('flat')
    .select('-password')
    .sort({ name: 1 });
  return sendResponse(res, 200, true, 'Residents directory', residents);
});

// ==================== STAFF & VENDORS ====================

const getStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.find().sort({ specialization: 1, name: 1 });
  return sendResponse(res, 200, true, 'Staff list retrieved', staff);
});

const createStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.create(req.body);
  return sendResponse(res, 201, true, 'Staff member added', staff);
});

const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
  return sendResponse(res, 200, true, 'Staff updated', staff);
});

const deleteStaff = asyncHandler(async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  return sendResponse(res, 200, true, 'Staff member deleted');
});

// ==================== NOTICES ====================

const getNotices = asyncHandler(async (req, res) => {
  const notices = await Notice.find().populate('author', 'name role').sort({ isPinned: -1, createdAt: -1 });
  return sendResponse(res, 200, true, 'Notices retrieved', notices);
});

const createNotice = asyncHandler(async (req, res) => {
  const { title, body, category, isPinned, expiryDate } = req.body;
  const notice = await Notice.create({
    title,
    body,
    category,
    isPinned,
    expiryDate,
    author: req.user._id,
  });

  return sendResponse(res, 201, true, 'Notice published successfully', notice);
});

const deleteNotice = asyncHandler(async (req, res) => {
  await Notice.findByIdAndDelete(req.params.id);
  return sendResponse(res, 200, true, 'Notice deleted');
});

// ==================== ANALYTICS & REPORTS ====================

const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalResidents,
    totalFlats,
    visitorsToday,
    openTickets,
    pendingApprovals,
    resolvedTicketsCount,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments({ role: 'resident', status: 'approved' }),
    Flat.countDocuments(),
    Visitor.countDocuments({ createdAt: { $gte: today } }),
    Ticket.countDocuments({ status: { $in: ['Open', 'Assigned', 'In Progress'] } }),
    User.countDocuments({ status: 'pending' }),
    Ticket.countDocuments({ status: { $in: ['Resolved', 'Closed'] } }),
    ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name role avatar'),
  ]);

  // Visitor traffic over last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const visitorTrend = await Visitor.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Tickets by category
  const ticketsByCategory = await Ticket.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);

  // Tickets by status
  const ticketsByStatus = await Ticket.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return sendResponse(res, 200, true, 'Admin dashboard metrics', {
    metrics: {
      totalResidents,
      totalFlats,
      visitorsToday,
      openTickets,
      pendingApprovals,
      resolvedTicketsCount,
    },
    visitorTrend,
    ticketsByCategory,
    ticketsByStatus,
    recentActivity,
  });
});

module.exports = {
  getFlats,
  createFlat,
  updateFlat,
  deleteFlat,
  getPendingRegistrations,
  decideRegistration,
  getResidentsDirectory,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getNotices,
  createNotice,
  deleteNotice,
  getAdminDashboardStats,
};
