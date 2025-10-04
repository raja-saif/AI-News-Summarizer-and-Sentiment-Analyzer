const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  resultsCount: {
    type: Number,
    default: 0
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  sentimentDistribution: {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 }
  },
  location: {
    country: String,
    city: String,
    timezone: String
  }
}, {
  timestamps: true
});

// Indexes
searchLogSchema.index({ keyword: 1, createdAt: -1 });
searchLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SearchLog', searchLogSchema);
