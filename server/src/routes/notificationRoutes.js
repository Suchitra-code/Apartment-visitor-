const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { asyncHandler, sendResponse } = require('../utils/response');

router.use(protect);

// @desc    Get user notifications
router.get('/', asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  return sendResponse(res, 200, true, 'Notifications retrieved', {
    notifications,
    unreadCount,
  });
}));

// @desc    Mark single notification as read
router.put('/:id/read', asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  return sendResponse(res, 200, true, 'Notification marked as read', notification);
}));

// @desc    Mark all as read
router.put('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id }, { isRead: true });
  return sendResponse(res, 200, true, 'All notifications marked as read');
}));

module.exports = router;
