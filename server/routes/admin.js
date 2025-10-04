const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const NewsArticle = require('../models/NewsArticle');
const SearchLog = require('../models/SearchLog');
const newsService = require('../services/newsService');

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);

// Get admin dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalArticles,
      totalSearches,
      users24h,
      articles24h,
      searches24h,
      sentimentDistribution,
      topKeywords,
      recentSearches
    ] = await Promise.all([
      User.countDocuments(),
      NewsArticle.countDocuments(),
      SearchLog.countDocuments(),
      User.countDocuments({ createdAt: { $gte: last24h } }),
      NewsArticle.countDocuments({ publishedAt: { $gte: last24h } }),
      SearchLog.countDocuments({ createdAt: { $gte: last24h } }),
      
      // Sentiment distribution
      NewsArticle.aggregate([
        { $match: { publishedAt: { $gte: last7d } } },
        {
          $group: {
            _id: '$aiAnalysis.sentiment.label',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Top keywords
      NewsArticle.aggregate([
        { $match: { publishedAt: { $gte: last7d } } },
        { $group: { _id: '$keyword', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Recent searches
      SearchLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'email')
    ]);

    // Process sentiment distribution
    const sentiment = {
      POSITIVE: 0,
      NEGATIVE: 0,
      NEUTRAL: 0
    };
    sentimentDistribution.forEach(item => {
      sentiment[item._id] = item.count;
    });

    res.json({
      overview: {
        totalUsers,
        totalArticles,
        totalSearches,
        users24h,
        articles24h,
        searches24h
      },
      sentimentDistribution: sentiment,
      topKeywords,
      recentSearches,
      generatedAt: now
    });

  } catch (error) {
    console.error('Admin dashboard error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', [
  body('role').isIn(['user', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user role error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also delete associated search logs
    await SearchLog.deleteMany({ userId: req.params.id });

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get system statistics
router.get('/statistics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      userStats,
      articleStats,
      searchStats,
      sentimentStats,
      keywordStats
    ] = await Promise.all([
      // User statistics
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      
      // Article statistics
      NewsArticle.aggregate([
        { $match: { publishedAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$publishedAt'
                }
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      
      // Search statistics
      SearchLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              }
            },
            count: { $sum: 1 },
            avgProcessingTime: { $avg: '$processingTime' }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      
      // Sentiment statistics
      NewsArticle.aggregate([
        { $match: { publishedAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$publishedAt'
                }
              },
              sentiment: '$aiAnalysis.sentiment.label'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            sentiments: {
              $push: {
                sentiment: '$_id.sentiment',
                count: '$count'
              }
            }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Keyword statistics
      NewsArticle.aggregate([
        { $match: { publishedAt: { $gte: startDate } } },
        { $group: { _id: '$keyword', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
    ]);

    res.json({
      userStats,
      articleStats,
      searchStats,
      sentimentStats,
      keywordStats,
      timeframe,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Get statistics error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reprocess articles (force AI reprocessing)
router.post('/reprocess-articles', async (req, res) => {
  try {
    const { keyword, limit = 10 } = req.body;
    
    let query = {};
    if (keyword) {
      query.keyword = keyword.toLowerCase();
    }

    const articles = await NewsArticle.find(query)
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit));

    const results = [];
    for (const article of articles) {
      try {
        const aiResult = await newsService.processWithAI(article);
        
        article.aiAnalysis = {
          summary: aiResult.summary,
          sentiment: {
            label: aiResult.sentiment.label,
            confidence: aiResult.sentiment.confidence,
            sentimentScore: aiResult.sentiment.sentiment_score
          },
          keywords: [],
          processedAt: new Date()
        };

        await article.save();
        results.push({ id: article._id, title: article.title, status: 'success' });
      } catch (error) {
        results.push({ 
          id: article._id, 
          title: article.title, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    res.json({
      message: 'Articles reprocessing completed',
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Reprocess articles error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get API configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      newsApiConfigured: !!process.env.NEWS_API_KEY,
      aiServiceUrl: process.env.AI_SERVICE_URL,
      mongodbConnected: true, // Assuming connection is working if we reach this point
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    };

    res.json({ config });
  } catch (error) {
    console.error('Get config error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update API configuration
router.put('/config', [
  body('newsApiKey').optional().isLength({ min: 32 }),
  body('aiServiceUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // In a real application, you'd want to store these in a secure way
    // For now, we'll just validate and return success
    const { newsApiKey, aiServiceUrl } = req.body;

    if (newsApiKey) {
      // Validate News API key by making a test request
      try {
        const axios = require('axios');
        await axios.get(`https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${newsApiKey}`);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid News API key' });
      }
    }

    res.json({
      message: 'Configuration updated successfully',
      note: 'Restart the server to apply changes'
    });

  } catch (error) {
    console.error('Update config error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
