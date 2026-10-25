const Ticket = require('../models/Ticket');
const Staff = require('../models/Staff');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { asyncHandler, sendResponse } = require('../utils/response');

// Helper to generate ticket identifier (e.g. TIK-84920)
const generateTicketNumber = () => {
  return `TIK-${Math.floor(10000 + Math.random() * 90000)}`;
};

// @desc    Raise a maintenance ticket
// @route   POST /api/v1/tickets
// @access  Resident / Admin
const createTicket = asyncHandler(async (req, res) => {
  const { title, category, priority, description, preferredSlot, flatId } = req.body;

  let userFlat = req.user.flat?._id || req.user.flat;
  if (req.user.role === 'admin' && flatId) {
    userFlat = flatId;
  }

  if (!userFlat) {
    return sendResponse(res, 400, false, 'No apartment flat is associated with your account.');
  }

  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
  }

  let ticketNumber = generateTicketNumber();
  let existing = await Ticket.findOne({ ticketNumber });
  while (existing) {
    ticketNumber = generateTicketNumber();
    existing = await Ticket.findOne({ ticketNumber });
  }

  // Calculate default SLA due date
  const now = new Date();
  let dueHours = 48; // default medium
  if (priority === 'Urgent') dueHours = 6;
  if (priority === 'High') dueHours = 24;
  if (priority === 'Low') dueHours = 72;
  const dueDate = new Date(now.getTime() + dueHours * 60 * 60 * 1000);

  const ticket = await Ticket.create({
    ticketNumber,
    title,
    category,
    priority: priority || 'Medium',
    description,
    images: imageUrls,
    flat: userFlat,
    createdBy: req.user._id,
    preferredSlot: preferredSlot || 'Anytime',
    status: 'Open',
    dueDate,
    timeline: [
      {
        status: 'Open',
        actor: req.user._id,
        notes: 'Ticket created by resident',
        timestamp: now,
      },
    ],
  });

  await ActivityLog.create({
    user: req.user._id,
    action: 'TICKET_CREATED',
    module: 'ticket',
    details: `Ticket ${ticket.ticketNumber}: ${title} (${category})`,
  });

  const populated = await Ticket.findById(ticket._id)
    .populate('flat', 'block floor number')
    .populate('createdBy', 'name email phone');

  return sendResponse(res, 201, true, 'Maintenance ticket raised successfully', populated);
});

// @desc    Get all tickets with filters, pagination, search
// @route   GET /api/v1/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    priority,
    status,
    flatId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  let query = {};

  if (req.user.role === 'resident') {
    query.createdBy = req.user._id;
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  if (priority && priority !== 'all') {
    query.priority = priority;
  }

  if (flatId) {
    query.flat = flatId;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ title: regex }, { description: regex }, { ticketNumber: regex }];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .populate('flat', 'block floor number type')
      .populate('createdBy', 'name email phone avatar')
      .populate('assignedTo', 'name phone specialization')
      .populate('comments.sender', 'name role avatar')
      .populate('timeline.actor', 'name role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Ticket.countDocuments(query),
  ]);

  return sendResponse(res, 200, true, 'Tickets retrieved', {
    tickets,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get ticket by ID
// @route   GET /api/v1/tickets/:id
// @access  Private
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('flat', 'block floor number type')
    .populate('createdBy', 'name email phone avatar')
    .populate('assignedTo', 'name phone specialization availability')
    .populate('comments.sender', 'name role avatar')
    .populate('timeline.actor', 'name role');

  if (!ticket) {
    return sendResponse(res, 404, false, 'Ticket not found.');
  }

  if (
    req.user.role === 'resident' &&
    ticket.createdBy._id.toString() !== req.user._id.toString()
  ) {
    return sendResponse(res, 403, false, 'Unauthorized to view tickets from other residents.');
  }

  return sendResponse(res, 200, true, 'Ticket details', ticket);
});

// @desc    Update ticket status, assign staff, internal notes (Admin)
// @route   PUT /api/v1/tickets/:id
// @access  Admin
const updateTicket = asyncHandler(async (req, res) => {
  const { status, assignedToId, dueDate, notes } = req.body;
  const ticket = await Ticket.findById(req.params.id).populate('createdBy');

  if (!ticket) {
    return sendResponse(res, 404, false, 'Ticket not found.');
  }

  const prevStatus = ticket.status;
  if (status && status !== prevStatus) {
    ticket.status = status;
    ticket.timeline.push({
      status,
      actor: req.user._id,
      notes: notes || `Status changed from ${prevStatus} to ${status}`,
      timestamp: new Date(),
    });

    if (status === 'Resolved' && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }
  }

  if (assignedToId) {
    const staff = await Staff.findById(assignedToId);
    if (staff) {
      ticket.assignedTo = staff._id;
      if (ticket.status === 'Open') {
        ticket.status = 'Assigned';
        ticket.timeline.push({
          status: 'Assigned',
          actor: req.user._id,
          notes: `Assigned to ${staff.name} (${staff.specialization})`,
          timestamp: new Date(),
        });
      }
      staff.activeTicketsCount = (staff.activeTicketsCount || 0) + 1;
      await staff.save();
    }
  }

  if (dueDate) {
    ticket.dueDate = new Date(dueDate);
  }

  await ticket.save();

  // Notify resident of update
  if (ticket.createdBy) {
    await Notification.create({
      recipient: ticket.createdBy._id,
      type: 'ticket_status_changed',
      title: `Ticket #${ticket.ticketNumber} Updated`,
      message: `Your ticket status is now: ${ticket.status}.`,
      link: `/maintenance/${ticket._id}`,
    });
  }

  await ActivityLog.create({
    user: req.user._id,
    action: 'TICKET_UPDATED',
    module: 'ticket',
    details: `Ticket ${ticket.ticketNumber} updated to ${ticket.status}`,
  });

  const updated = await Ticket.findById(ticket._id)
    .populate('flat', 'block floor number')
    .populate('createdBy', 'name email phone')
    .populate('assignedTo', 'name phone specialization')
    .populate('timeline.actor', 'name role');

  return sendResponse(res, 200, true, 'Ticket updated successfully', updated);
});

// @desc    Add comment to ticket
// @route   POST /api/v1/tickets/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return sendResponse(res, 400, false, 'Comment message cannot be empty.');
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return sendResponse(res, 404, false, 'Ticket not found.');
  }

  ticket.comments.push({
    sender: req.user._id,
    message: message.trim(),
    createdAt: new Date(),
  });

  await ticket.save();

  // Notify opposite party
  let recipientId = null;
  if (req.user.role === 'resident') {
    // If resident posted comment, notify admin or staff
    // In our system, notifications go to admin accounts
  } else {
    // Admin posted comment, notify resident
    recipientId = ticket.createdBy;
    await Notification.create({
      recipient: recipientId,
      type: 'ticket_comment',
      title: `New Comment on Ticket #${ticket.ticketNumber}`,
      message: `${req.user.name} added a note: "${message.substring(0, 40)}..."`,
      link: `/maintenance/${ticket._id}`,
    });
  }

  const updatedTicket = await Ticket.findById(ticket._id)
    .populate('comments.sender', 'name role avatar');

  return sendResponse(res, 201, true, 'Comment added successfully', updatedTicket.comments);
});

// @desc    Submit feedback/rating after resolution
// @route   POST /api/v1/tickets/:id/feedback
// @access  Resident
const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return sendResponse(res, 404, false, 'Ticket not found.');
  }

  if (ticket.createdBy.toString() !== req.user._id.toString()) {
    return sendResponse(res, 403, false, 'Only the ticket owner can provide feedback.');
  }

  if (ticket.status !== 'Resolved' && ticket.status !== 'Closed') {
    return sendResponse(res, 400, false, 'Feedback can only be provided after ticket is resolved.');
  }

  ticket.rating = rating;
  ticket.feedback = feedback || '';
  ticket.status = 'Closed';
  ticket.timeline.push({
    status: 'Closed',
    actor: req.user._id,
    notes: `Rated ${rating} stars by resident: "${feedback || 'No comments'}"`,
    timestamp: new Date(),
  });

  await ticket.save();

  return sendResponse(res, 200, true, 'Thank you for your rating and feedback!', ticket);
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  submitFeedback,
};
