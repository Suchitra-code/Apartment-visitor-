const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getVisitors);
router.get('/active', authorize('guard', 'admin'), getActiveInsideVisitors);
router.get('/export/csv', authorize('admin'), exportVisitorsCSV);

router.post('/pre-approve', authorize('resident', 'admin'), preApproveVisitor);
router.post('/walk-in', authorize('guard', 'admin'), upload.single('photo'), createWalkIn);
router.put('/:id/decision', authorize('resident', 'admin'), decideVisitorApproval);

router.post('/check-in', authorize('guard', 'admin'), checkInVisitor);
router.post('/check-out', authorize('guard', 'admin'), checkOutVisitor);

// Blacklist management
router.get('/blacklist', authorize('admin', 'guard'), getBlacklist);
router.post('/blacklist', authorize('admin'), addToBlacklist);
router.delete('/blacklist/:id', authorize('admin'), removeFromBlacklist);

module.exports = router;
