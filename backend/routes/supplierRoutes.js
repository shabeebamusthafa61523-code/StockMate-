const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getSuppliers)
  .post(protect, authorize('admin', 'storekeeper'), createSupplier);

router
  .route('/:id')
  .get(protect, getSupplierById)
  .put(protect, authorize('admin', 'storekeeper'), updateSupplier);

module.exports = router;
