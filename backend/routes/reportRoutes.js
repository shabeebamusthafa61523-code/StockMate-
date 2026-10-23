const express = require('express');
const router = express.Router();
const {
  getSalesProfitReport,
  getGstSummaryReport,
  getStockValuationReport,
  getBalancesReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/sales-profit', protect, authorize('admin'), getSalesProfitReport);
router.get('/gst-summary', protect, authorize('admin'), getGstSummaryReport);
router.get('/stock-valuation', protect, authorize('admin', 'storekeeper'), getStockValuationReport);
router.get('/balances', protect, getBalancesReport);

module.exports = router;
