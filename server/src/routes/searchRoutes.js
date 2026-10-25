const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const Ticket = require('../models/Ticket');
const Flat = require('../models/Flat');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler, sendResponse } = require('../utils/response');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return sendResponse(res, 200, true, 'No search term provided', { visitors: [], tickets: [], flats: [] });
  }

  const regex = new RegExp(q.trim(), 'i');

  let visitorQuery = {
    $or: [{ name: regex }, { phone: regex }, { passCode: regex }, { vehicleNumber: regex }],
  };
  let ticketQuery = {
    $or: [{ title: regex }, { ticketNumber: regex }, { category: regex }],
  };

  if (req.user.role === 'resident') {
    visitorQuery.$or = [{ host: req.user._id }, { flat: req.user.flat?._id || req.user.flat }];
    ticketQuery.createdBy = req.user._id;
  }

  const [visitors, tickets, flats, residents] = await Promise.all([
    Visitor.find(visitorQuery).limit(5).populate('flat', 'block number').select('name passCode status purpose flat'),
    Ticket.find(ticketQuery).limit(5).select('title ticketNumber category priority status'),
    req.user.role === 'admin' ? Flat.find({ number: regex }).limit(5) : [],
    req.user.role === 'admin' ? User.find({ name: regex, role: 'resident' }).limit(5).select('name email phone flat') : [],
  ]);

  return sendResponse(res, 200, true, 'Global search results', {
    visitors,
    tickets,
    flats,
    residents,
  });
}));

module.exports = router;
