const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  processPurchaseReturn,
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getPurchases)
  .post(protect, authorize('admin', 'storekeeper'), createPurchase);

router.route('/:id').get(protect, getPurchaseById);
router.post('/:id/return', protect, authorize('admin', 'storekeeper'), processPurchaseReturn);

module.exports = router;
