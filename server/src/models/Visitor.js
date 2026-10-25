const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Visitor phone number is required'],
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['guest', 'delivery', 'cab', 'service', 'other'],
      default: 'guest',
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: [true, 'Flat reference is required'],
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host resident reference is required'],
    },
    passCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    expectedAt: {
      type: Date,
      required: [true, 'Expected arrival date/time is required'],
    },
    validUntil: {
      type: Date,
      required: [true, 'Pass validity expiration is required'],
    },
    peopleCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: [
        'Pre-approved',
        'Pending Approval',
        'Approved',
        'Denied',
        'Checked-In',
        'Checked-Out',
        'Expired',
        'Cancelled',
      ],
      default: 'Pre-approved',
    },
    checkInAt: {
      type: Date,
    },
    checkOutAt: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
    },
    photo: {
      type: String,
      default: '',
    },
    isWalkIn: {
      type: Boolean,
      default: false,
    },
    guardNotes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

visitorSchema.index({ host: 1, createdAt: -1 });
visitorSchema.index({ status: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
