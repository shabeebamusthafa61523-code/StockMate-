const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, deleteExpense } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getExpenses)
  .post(protect, createExpense);

router.route('/:id').delete(protect, authorize('admin'), deleteExpense);

module.exports = router;
