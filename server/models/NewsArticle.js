const mongoose = require('mongoose');

const newsArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    name: String,
    url: String
  },
  publishedAt: {
    type: Date,
    required: true
  },
  keyword: {
    type: String,
    required: true,
    index: true
  },
  aiAnalysis: {
    summary: String,
    sentiment: {
      label: {
        type: String,
        enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
        required: true
      },
      confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      sentimentScore: {
        type: Number,
        required: true,
        min: -1,
        max: 1
      }
    },
    keywords: [String],
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  metadata: {
    wordCount: Number,
    readingTime: Number,
    category: String,
    language: { type: String, default: 'en' }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
newsArticleSchema.index({ keyword: 1, publishedAt: -1 });
newsArticleSchema.index({ 'aiAnalysis.sentiment.label': 1 });
newsArticleSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('NewsArticle', newsArticleSchema);
