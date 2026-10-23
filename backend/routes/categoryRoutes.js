const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getCategories)
  .post(protect, authorize('admin', 'storekeeper'), createCategory);

router
  .route('/:id')
  .put(protect, authorize('admin', 'storekeeper'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

module.exports = router;
