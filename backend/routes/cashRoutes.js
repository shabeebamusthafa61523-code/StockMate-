const express = require('express');
const router = express.Router();
const {
  getCurrentSession,
  openCashSession,
  closeCashSession,
  getSessionHistory,
} = require('../controllers/cashController');
const { protect } = require('../middleware/authMiddleware');

router.get('/current', protect, getCurrentSession);
router.post('/open', protect, openCashSession);
router.post('/close', protect, closeCashSession);
router.get('/history', protect, getSessionHistory);

module.exports = router;
