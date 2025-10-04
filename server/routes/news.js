const express = require('express');
const { body, validationResult } = require('express-validator');
const newsService = require('../services/newsService');
const NewsArticle = require('../models/NewsArticle');
const SearchLog = require('../models/SearchLog');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Search news with keyword
router.post('/search', [
  body('keyword').isLength({ min: 2, max: 100 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { keyword } = req.body;
    const userId = req.user?._id || null;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';

    // Search for news
    const result = await newsService.searchNews(keyword, userId, ipAddress);

    // Log the search
    const sentimentDistribution = {
      positive: 0,
      negative: 0,
      neutral: 0
    };

    result.articles.forEach(article => {
      const sentiment = article.aiAnalysis.sentiment.label.toLowerCase();
      if (sentimentDistribution.hasOwnProperty(sentiment)) {
        sentimentDistribution[sentiment]++;
      }
    });

    const searchLog = new SearchLog({
      keyword,
      userId,
      ipAddress,
      userAgent,
      resultsCount: result.articles.length,
      processingTime: result.processingTime,
      sentimentDistribution
    });

    await searchLog.save();

    // Update user search history if authenticated
    if (userId) {
      await req.user.updateOne({
        $push: {
          searches: {
            keyword,
            resultsCount: result.articles.length,
            timestamp: new Date()
          }
        }
      });
    }

    res.json({
      keyword,
      articles: result.articles,
      totalCount: result.articles.length,
      fromCache: result.fromCache,
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error('News search error:', error.message);
    res.status(500).json({ 
      error: 'Failed to search news',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get article by ID
router.get('/article/:id', async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ article });
  } catch (error) {
    console.error('Get article error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent articles
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const articles = await NewsArticle.find()
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title description url source publishedAt keyword aiAnalysis.sentiment aiAnalysis.summary');

    const totalCount = await NewsArticle.countDocuments();

    res.json({
      articles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get recent articles error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get articles by sentiment
router.get('/sentiment/:sentiment', async (req, res) => {
  try {
    const { sentiment } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    if (!['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(sentiment.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid sentiment. Must be POSITIVE, NEGATIVE, or NEUTRAL' });
    }

    const articles = await NewsArticle.find({
      'aiAnalysis.sentiment.label': sentiment.toUpperCase()
    })
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await NewsArticle.countDocuments({
      'aiAnalysis.sentiment.label': sentiment.toUpperCase()
    });

    res.json({
      articles,
      sentiment: sentiment.toUpperCase(),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get articles by sentiment error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get trending keywords
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const trending = await newsService.getTrendingKeywords(limit);

    res.json({ trending });
  } catch (error) {
    console.error('Get trending keywords error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user search history (authenticated users only)
router.get('/history', auth, async (req, res) => {
  try {
    const user = await req.user.populate('searches');
    const history = user.searches.slice(-20).reverse(); // Last 20 searches

    res.json({ history });
  } catch (error) {
    console.error('Get search history error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reprocess article with AI (for debugging/admin purposes)
router.post('/reprocess/:id', async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Reprocess with AI
    const aiResult = await newsService.processWithAI(article);
    
    // Update article
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

    res.json({
      message: 'Article reprocessed successfully',
      article
    });

  } catch (error) {
    console.error('Reprocess article error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
