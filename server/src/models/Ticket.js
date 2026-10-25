const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const timelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Plumbing',
        'Electrical',
        'Lift',
        'Cleaning',
        'Security',
        'Carpentry',
        'Pest Control',
        'Other',
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    images: [
      {
        type: String,
      },
    ],
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    preferredSlot: {
      type: String,
      default: 'Anytime',
    },
    status: {
      type: String,
      enum: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Reopened'],
      default: 'Open',
    },
    dueDate: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      default: '',
    },
    timeline: [timelineSchema],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ flat: 1, createdAt: -1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
