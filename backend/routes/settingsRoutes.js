const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getAuditLogs,
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getSettings)
  .put(protect, authorize('admin'), updateSettings);

router.get('/audit-logs', protect, authorize('admin'), getAuditLogs);

module.exports = router;
