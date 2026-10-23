const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Unit name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Unit code/symbol is required'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    allowDecimals: {
      type: Boolean,
      default: false,
    },
    conversions: [
      {
        targetUnit: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Unit',
        },
        multiplier: {
          type: Number,
          required: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Unit', unitSchema);
