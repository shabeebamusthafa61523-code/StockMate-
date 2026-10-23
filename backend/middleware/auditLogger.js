const AuditLog = require('../models/AuditLog');

const logAudit = async ({ user, action, entity, entityId, details, req }) => {
  try {
    const ipAddress = req ? req.headers['x-forwarded-for'] || req.socket.remoteAddress : '';
    await AuditLog.create({
      user: user ? user._id : null,
      userName: user ? user.name : 'System',
      action,
      entity,
      entityId: entityId ? entityId.toString() : '',
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

module.exports = { logAudit };
