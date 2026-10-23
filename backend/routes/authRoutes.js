const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  loginUser,
  getMe,
  getUsers,
  createUser,
  updateUser,
  changePassword,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login requests per windowMs
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, loginUser);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

// User Management (Admin only)
router.get('/users', protect, authorize('admin'), getUsers);
router.post('/users', protect, authorize('admin'), createUser);
router.put('/users/:id', protect, authorize('admin'), updateUser);

module.exports = router;
