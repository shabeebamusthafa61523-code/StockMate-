const express = require('express');
const router = express.Router();
const {
  getStockMovements,
  recordDamage,
  recordAdjustment,
} = require('../controllers/stockMovementController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/movements', protect, getStockMovements);
router.post('/damage', protect, authorize('admin', 'storekeeper'), recordDamage);
router.post('/adjust', protect, authorize('admin', 'storekeeper'), recordAdjustment);

module.exports = router;
