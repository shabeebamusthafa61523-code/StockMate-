const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAudit } = require('../middleware/auditLogger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_hardware_jwt_key_2026_production', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated. Contact owner.' });
    }

    user.lastLogin = new Date();
    await user.save();

    await logAudit({
      user,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      details: { role: user.role },
      req,
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user (Admin only)
// @route   POST /api/auth/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
  try {
    const { name, username, email, password, role, phone } = req.body;

    const userExists = await User.findOne({ username: username.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username already in use' });
    }

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email,
      password,
      role: role || 'cashier',
      phone,
      createdBy: req.user._id,
    });

    await logAudit({
      user: req.user,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id,
      details: { newUsername: user.username, role: user.role },
      req,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, phone, isActive, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();

    await logAudit({
      user: req.user,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user._id,
      details: { updatedUsername: user.username, role: user.role, isActive: user.isActive },
      req,
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change own password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  getMe,
  getUsers,
  createUser,
  updateUser,
  changePassword,
};
