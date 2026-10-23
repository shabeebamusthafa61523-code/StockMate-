const Unit = require('../models/Unit');

const getUnits = async (req, res, next) => {
  try {
    const units = await Unit.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: units });
  } catch (error) {
    next(error);
  }
};

const createUnit = async (req, res, next) => {
  try {
    const { name, code, allowDecimals, conversions } = req.body;
    const existing = await Unit.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Unit code already exists' });
    }
    const unit = await Unit.create({
      name,
      code: code.toUpperCase(),
      allowDecimals: !!allowDecimals,
      conversions: conversions || [],
    });
    res.status(201).json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
};

const updateUnit = async (req, res, next) => {
  try {
    const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    res.json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUnits, createUnit, updateUnit };
