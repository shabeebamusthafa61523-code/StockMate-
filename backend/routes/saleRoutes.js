const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  cancelSale,
  processSalesReturn,
} = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getSales)
  .post(protect, createSale);

router.route('/:id').get(protect, getSaleById);
router.put('/:id/cancel', protect, authorize('admin', 'cashier'), cancelSale);
router.post('/:id/return', protect, authorize('admin', 'cashier'), processSalesReturn);

module.exports = router;
