const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      enum: [
        'Plumber',
        'Electrician',
        'Housekeeping',
        'Lift Technician',
        'Carpenter',
        'Security Officer',
        'Pest Specialist',
        'HVAC/General Maintenance',
      ],
      required: true,
    },
    availability: {
      type: String,
      enum: ['Available', 'On Leave', 'Busy'],
      default: 'Available',
    },
    activeTicketsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Staff', staffSchema);
