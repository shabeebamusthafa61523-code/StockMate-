const express = require('express');
const router = express.Router();
const { getPayments, recordPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getPayments)
  .post(protect, recordPayment);

module.exports = router;
