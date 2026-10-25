const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  submitFeedback,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', upload.array('images', 3), createTicket);
router.put('/:id', authorize('admin'), updateTicket);
router.post('/:id/comments', addComment);
router.post('/:id/feedback', authorize('resident'), submitFeedback);

module.exports = router;
