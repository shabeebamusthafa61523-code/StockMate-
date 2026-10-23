const express = require('express');
const router = express.Router();
const { getUnits, createUnit, updateUnit } = require('../controllers/unitController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getUnits)
  .post(protect, authorize('admin', 'storekeeper'), createUnit);

router
  .route('/:id')
  .put(protect, authorize('admin', 'storekeeper'), updateUnit);

module.exports = router;
