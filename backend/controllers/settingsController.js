const ShopSettings = require('../models/ShopSettings');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get shop settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    let settings = await ShopSettings.findOne();
    if (!settings) {
      settings = await ShopSettings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shop settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res, next) => {
  try {
    let settings = await ShopSettings.findOne();
    if (!settings) {
      settings = new ShopSettings();
    }

    Object.assign(settings, req.body);
    await settings.save();

    await logAudit({
      user: req.user,
      action: 'UPDATE_SETTINGS',
      entity: 'ShopSettings',
      entityId: settings._id,
      details: { shopName: settings.shopName },
      req,
    });

    res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit logs
// @route   GET /api/settings/audit-logs
// @access  Private/Admin
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entity, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (entity) query.entity = entity;

    const total = await AuditLog.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const logs = await AuditLog.find(query)
      .populate('user', 'name role username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getAuditLogs,
};
