const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema(
  {
    block: {
      type: String,
      required: [true, 'Block name/letter is required (e.g. A, B, C)'],
      trim: true,
      uppercase: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: 0,
    },
    number: {
      type: String,
      required: [true, 'Flat number is required (e.g. 101, 402)'],
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Studio'],
      default: '2BHK',
    },
    status: {
      type: String,
      enum: ['occupied', 'vacant', 'under_maintenance'],
      default: 'vacant',
    },
    residents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

flatSchema.index({ block: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Flat', flatSchema);
