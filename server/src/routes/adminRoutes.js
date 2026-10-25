const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Notices are readable by all authenticated users
router.get('/notices', getNotices);

// Restricted to Admin
router.use(authorize('admin'));

router.get('/metrics', getAdminDashboardStats);

router.get('/flats', getFlats);
router.post('/flats', createFlat);
router.put('/flats/:id', updateFlat);
router.delete('/flats/:id', deleteFlat);

router.get('/registrations/pending', getPendingRegistrations);
router.put('/registrations/:id', decideRegistration);
router.get('/residents', getResidentsDirectory);

router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);

router.post('/notices', createNotice);
router.delete('/notices/:id', deleteNotice);

module.exports = router;
