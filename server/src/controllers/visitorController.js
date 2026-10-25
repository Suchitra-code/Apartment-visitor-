const Visitor = require('../models/Visitor');
const Flat = require('../models/Flat');
const User = require('../models/User');
const BlacklistedVisitor = require('../models/BlacklistedVisitor');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { asyncHandler, sendResponse } = require('../utils/response');

// Helper to generate 6-character alphanumeric pass code
const generatePassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @desc    Pre-approve visitor (by Resident)
// @route   POST /api/v1/visitors/pre-approve
// @access  Resident / Admin
const preApproveVisitor = asyncHandler(async (req, res) => {
  const { name, phone, purpose, vehicleNumber, expectedAt, validUntil, peopleCount, flatId } = req.body;

  // Check if visitor is blacklisted
  const blacklisted = await BlacklistedVisitor.findOne({ phone: phone.trim() });
  if (blacklisted) {
    return sendResponse(
      res,
      400,
      false,
      `Security Alert: Visitor with phone ${phone} is currently blacklisted: ${blacklisted.reason}`
    );
  }

  let hostId = req.user._id;
  let targetFlat = req.user.flat?._id || req.user.flat;

  // If Admin is creating on behalf of a flat
  if (req.user.role === 'admin' && flatId) {
    targetFlat = flatId;
    const residentOfFlat = await User.findOne({ flat: flatId, role: 'resident' });
    if (residentOfFlat) hostId = residentOfFlat._id;
  }

  if (!targetFlat) {
    return sendResponse(res, 400, false, 'No apartment flat is associated with your account.');
  }

  // Generate unique passCode
  let passCode = generatePassCode();
  let existing = await Visitor.findOne({ passCode });
  while (existing) {
    passCode = generatePassCode();
    existing = await Visitor.findOne({ passCode });
  }

  const expDate = expectedAt ? new Date(expectedAt) : new Date();
  const valDate = validUntil ? new Date(validUntil) : new Date(expDate.getTime() + 24 * 60 * 60 * 1000); // 24hr default

  const visitor = await Visitor.create({
    name,
    phone,
    purpose: purpose || 'guest',
    vehicleNumber: vehicleNumber || '',
    flat: targetFlat,
    host: hostId,
    passCode,
    expectedAt: expDate,
    validUntil: valDate,
    peopleCount: peopleCount || 1,
    status: 'Pre-approved',
    createdBy: req.user._id,
  });

  await ActivityLog.create({
    user: req.user._id,
    action: 'PRE_APPROVE_VISITOR',
    module: 'visitor',
    details: `Pass generated for visitor ${name} (${passCode})`,
  });

  const populatedVisitor = await Visitor.findById(visitor._id)
    .populate('flat', 'block floor number')
    .populate('host', 'name phone email');

  return sendResponse(res, 201, true, 'Visitor pass pre-approved successfully', populatedVisitor);
});

// @desc    Walk-in entry by Guard
// @route   POST /api/v1/visitors/walk-in
// @access  Guard / Admin
const createWalkIn = asyncHandler(async (req, res) => {
  const { name, phone, purpose, vehicleNumber, flatId, peopleCount, guardNotes } = req.body;

  // Check blacklist
  const blacklisted = await BlacklistedVisitor.findOne({ phone: phone.trim() });
  if (blacklisted) {
    return sendResponse(
      res,
      400,
      false,
      `Access Denied: Visitor with phone ${phone} is BLACKLISTED! Reason: ${blacklisted.reason}`
    );
  }

  const flat = await Flat.findById(flatId).populate('residents');
  if (!flat) {
    return sendResponse(res, 404, false, 'Target apartment flat not found.');
  }

  const hostResident = flat.residents && flat.residents.length > 0 ? flat.residents[0] : null;

  let passCode = generatePassCode();
  let existing = await Visitor.findOne({ passCode });
  while (existing) {
    passCode = generatePassCode();
    existing = await Visitor.findOne({ passCode });
  }

  let photoUrl = '';
  if (req.file) {
    photoUrl = `/uploads/${req.file.filename}`;
  }

  const visitor = await Visitor.create({
    name,
    phone,
    purpose: purpose || 'guest',
    vehicleNumber: vehicleNumber || '',
    flat: flatId,
    host: hostResident ? hostResident._id : req.user._id,
    passCode,
    expectedAt: new Date(),
    validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
    peopleCount: peopleCount || 1,
    status: 'Pending Approval',
    isWalkIn: true,
    photo: photoUrl,
    guardNotes: guardNotes || '',
    createdBy: req.user._id,
  });

  // Create real-time notification for the host resident
  if (hostResident) {
    await Notification.create({
      recipient: hostResident._id,
      type: 'visitor_approval_request',
      title: 'Visitor at Gate Clearance',
      message: `${name} is at the security gate requesting entry for flat ${flat.block}-${flat.number}.`,
      link: '/visitors',
      metadata: { visitorId: visitor._id, passCode },
    });
  }

  await ActivityLog.create({
    user: req.user._id,
    action: 'WALK_IN_CREATED',
    module: 'visitor',
    details: `Guard registered walk-in visitor ${name} for Flat ${flat.block}-${flat.number}`,
  });

  const populated = await Visitor.findById(visitor._id)
    .populate('flat', 'block floor number')
    .populate('host', 'name phone email');

  return sendResponse(res, 201, true, 'Walk-in recorded and sent to resident for approval', populated);
});

// @desc    Resident Approve or Deny Walk-in Visitor
// @route   PUT /api/v1/visitors/:id/decision
// @access  Resident / Admin
const decideVisitorApproval = asyncHandler(async (req, res) => {
  const { decision } = req.body; // 'Approved' or 'Denied'
  const visitor = await Visitor.findById(req.params.id).populate('flat').populate('host');

  if (!visitor) {
    return sendResponse(res, 404, false, 'Visitor record not found.');
  }

  if (
    req.user.role === 'resident' &&
    visitor.host._id.toString() !== req.user._id.toString()
  ) {
    return sendResponse(res, 403, false, 'Unauthorized to approve visitors for another flat.');
  }

  if (visitor.status !== 'Pending Approval') {
    return sendResponse(res, 400, false, `Cannot change decision. Current status is ${visitor.status}.`);
  }

  visitor.status = decision === 'Approved' ? 'Approved' : 'Denied';
  await visitor.save();

  // Notify Guards / Activity
  await ActivityLog.create({
    user: req.user._id,
    action: `VISITOR_${decision.toUpperCase()}`,
    module: 'visitor',
    details: `Resident ${req.user.name} marked visitor ${visitor.name} as ${decision}`,
  });

  return sendResponse(res, 200, true, `Visitor marked as ${decision}`, visitor);
});

// @desc    Check-in visitor (by Guard)
// @route   POST /api/v1/visitors/check-in
// @access  Guard / Admin
const checkInVisitor = asyncHandler(async (req, res) => {
  const { passCode, visitorId } = req.body;

  let query = {};
  if (visitorId) {
    query._id = visitorId;
  } else if (passCode) {
    query.passCode = passCode.trim().toUpperCase();
  } else {
    return sendResponse(res, 400, false, 'Pass code or visitor ID is required.');
  }

  const visitor = await Visitor.findOne(query).populate('flat').populate('host');
  if (!visitor) {
    return sendResponse(res, 404, false, 'Invalid pass code. No visitor found.');
  }

  // Edge-case check 1: Already checked in
  if (visitor.status === 'Checked-In') {
    return sendResponse(
      res,
      400,
      false,
      `Visitor ${visitor.name} is already checked in at ${visitor.checkInAt.toLocaleTimeString()}.`
    );
  }

  // Edge-case check 2: Already checked out
  if (visitor.status === 'Checked-Out') {
    return sendResponse(
      res,
      400,
      false,
      `This pass code has already been used and checked out. Single-entry pass cannot be reused.`
    );
  }

  // Edge-case check 3: Expired pass
  const now = new Date();
  if (visitor.validUntil && new Date(visitor.validUntil) < now) {
    visitor.status = 'Expired';
    await visitor.save();
    return sendResponse(res, 400, false, 'This visitor pass has expired. Please request a new pass.');
  }

  // Edge-case check 4: Denied or Pending
  if (visitor.status === 'Denied') {
    return sendResponse(res, 403, false, 'Access Denied: This visitor request was rejected by the resident.');
  }
  if (visitor.status === 'Pending Approval') {
    return sendResponse(res, 400, false, 'Awaiting approval from the resident. Entry cannot be cleared yet.');
  }

  // Check Blacklist
  const blacklisted = await BlacklistedVisitor.findOne({ phone: visitor.phone });
  if (blacklisted) {
    return sendResponse(res, 403, false, `Entry Blocked: Visitor is blacklisted (${blacklisted.reason})`);
  }

  visitor.status = 'Checked-In';
  visitor.checkInAt = now;
  await visitor.save();

  // Create notification for host resident
  if (visitor.host) {
    await Notification.create({
      recipient: visitor.host._id,
      type: 'visitor_arrived',
      title: 'Visitor Checked-In',
      message: `${visitor.name} has entered the gate and is proceeding to Flat ${visitor.flat?.block}-${visitor.flat?.number}.`,
      link: '/visitors',
    });
  }

  await ActivityLog.create({
    user: req.user._id,
    action: 'VISITOR_CHECK_IN',
    module: 'visitor',
    details: `Guard checked in visitor ${visitor.name} (${visitor.passCode})`,
  });

  return sendResponse(res, 200, true, `Visitor ${visitor.name} checked in successfully`, visitor);
});

// @desc    Check-out visitor (by Guard)
// @route   POST /api/v1/visitors/check-out
// @access  Guard / Admin
const checkOutVisitor = asyncHandler(async (req, res) => {
  const { visitorId, passCode } = req.body;

  let query = {};
  if (visitorId) {
    query._id = visitorId;
  } else if (passCode) {
    query.passCode = passCode.trim().toUpperCase();
  } else {
    return sendResponse(res, 400, false, 'Visitor ID or pass code is required.');
  }

  const visitor = await Visitor.findOne(query).populate('flat').populate('host');
  if (!visitor) {
    return sendResponse(res, 404, false, 'Visitor record not found.');
  }

  // Edge-case check: Requires prior check-in
  if (visitor.status !== 'Checked-In') {
    return sendResponse(
      res,
      400,
      false,
      `Cannot check out: Visitor is currently '${visitor.status}'. A visitor must be checked-in first.`
    );
  }

  const now = new Date();
  visitor.status = 'Checked-Out';
  visitor.checkOutAt = now;

  if (visitor.checkInAt) {
    const diffMs = now.getTime() - new Date(visitor.checkInAt).getTime();
    visitor.durationMinutes = Math.round(diffMs / 60000);
  }

  await visitor.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'VISITOR_CHECK_OUT',
    module: 'visitor',
    details: `Visitor ${visitor.name} checked out (Stay: ${visitor.durationMinutes || 0} mins)`,
  });

  return sendResponse(res, 200, true, `Visitor ${visitor.name} checked out successfully`, visitor);
});

// @desc    Get visitor log list (Role-filtered)
// @route   GET /api/v1/visitors
// @access  Private
const getVisitors = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    purpose,
    flatId,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  let query = {};

  // RBAC Filter: Residents only see visitors for their flat/host
  if (req.user.role === 'resident') {
    query.$or = [{ host: req.user._id }, { flat: req.user.flat?._id || req.user.flat }];
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  if (purpose && purpose !== 'all') {
    query.purpose = purpose;
  }

  if (flatId) {
    query.flat = flatId;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { name: searchRegex },
        { phone: searchRegex },
        { passCode: searchRegex },
        { vehicleNumber: searchRegex },
      ],
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [visitors, total] = await Promise.all([
    Visitor.find(query)
      .populate('flat', 'block floor number type')
      .populate('host', 'name phone email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Visitor.countDocuments(query),
  ]);

  return sendResponse(res, 200, true, 'Visitors fetched successfully', {
    visitors,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Export visitor log as CSV (Admin)
// @route   GET /api/v1/visitors/export/csv
// @access  Admin
const exportVisitorsCSV = asyncHandler(async (req, res) => {
  const visitors = await Visitor.find()
    .populate('flat', 'block number')
    .populate('host', 'name phone')
    .sort({ createdAt: -1 });

  let csv = 'PassCode,VisitorName,Phone,Purpose,Flat,Host,Status,ExpectedAt,CheckIn,CheckOut,DurationMinutes\n';

  visitors.forEach((v) => {
    const flatStr = v.flat ? `${v.flat.block}-${v.flat.number}` : 'N/A';
    const hostStr = v.host ? v.host.name : 'N/A';
    const inTime = v.checkInAt ? new Date(v.checkInAt).toISOString() : '';
    const outTime = v.checkOutAt ? new Date(v.checkOutAt).toISOString() : '';
    const expTime = v.expectedAt ? new Date(v.expectedAt).toISOString() : '';

    csv += `"${v.passCode}","${v.name}","${v.phone}","${v.purpose}","${flatStr}","${hostStr}","${v.status}","${expTime}","${inTime}","${outTime}","${v.durationMinutes || 0}"\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment(`apartmenthub-visitors-${Date.now()}.csv`);
  return res.send(csv);
});

// @desc    Get active visitors currently inside
// @route   GET /api/v1/visitors/active
// @access  Guard / Admin
const getActiveInsideVisitors = asyncHandler(async (req, res) => {
  const active = await Visitor.find({ status: 'Checked-In' })
    .populate('flat', 'block floor number')
    .populate('host', 'name phone')
    .sort({ checkInAt: -1 });

  return sendResponse(res, 200, true, 'Active checked-in visitors', active);
});

// @desc    Blacklist a visitor
// @route   POST /api/v1/visitors/blacklist
// @access  Admin
const addToBlacklist = asyncHandler(async (req, res) => {
  const { name, phone, reason } = req.body;

  const existing = await BlacklistedVisitor.findOne({ phone: phone.trim() });
  if (existing) {
    return sendResponse(res, 400, false, 'This phone number is already blacklisted.');
  }

  const blacklisted = await BlacklistedVisitor.create({
    name,
    phone: phone.trim(),
    reason,
    addedBy: req.user._id,
  });

  return sendResponse(res, 201, true, `Visitor ${name} added to blacklist`, blacklisted);
});

// @desc    Get blacklisted visitors
// @route   GET /api/v1/visitors/blacklist
// @access  Admin / Guard
const getBlacklist = asyncHandler(async (req, res) => {
  const list = await BlacklistedVisitor.find().populate('addedBy', 'name email').sort({ createdAt: -1 });
  return sendResponse(res, 200, true, 'Blacklist retrieved', list);
});

// @desc    Remove from blacklist
// @route   DELETE /api/v1/visitors/blacklist/:id
// @access  Admin
const removeFromBlacklist = asyncHandler(async (req, res) => {
  await BlacklistedVisitor.findByIdAndDelete(req.params.id);
  return sendResponse(res, 200, true, 'Visitor removed from blacklist');
});

module.exports = {
  preApproveVisitor,
  createWalkIn,
  decideVisitorApproval,
  checkInVisitor,
  checkOutVisitor,
  getVisitors,
  exportVisitorsCSV,
  getActiveInsideVisitors,
  addToBlacklist,
  getBlacklist,
  removeFromBlacklist,
};
