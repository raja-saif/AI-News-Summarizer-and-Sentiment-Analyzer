const express = require('express');
const NewsArticle = require('../models/NewsArticle');
const SearchLog = require('../models/SearchLog');
const User = require('../models/User');

const router = express.Router();

// Get sentiment distribution analytics
router.get('/sentiment', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '7d';
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const sentimentData = await NewsArticle.aggregate([
      {
        $match: {
          publishedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$aiAnalysis.sentiment.label',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$aiAnalysis.sentiment.confidence' }
        }
      }
    ]);

    const distribution = {
      POSITIVE: { count: 0, avgConfidence: 0 },
      NEGATIVE: { count: 0, avgConfidence: 0 },
      NEUTRAL: { count: 0, avgConfidence: 0 }
    };

    sentimentData.forEach(item => {
      if (distribution[item._id]) {
        distribution[item._id] = {
          count: item.count,
          avgConfidence: Math.round(item.avgConfidence * 100) / 100
        };
      }
    });

    const total = Object.values(distribution).reduce((sum, item) => sum + item.count, 0);

    // Calculate percentages
    Object.keys(distribution).forEach(key => {
      distribution[key].percentage = total > 0 
        ? Math.round((distribution[key].count / total) * 100) 
        : 0;
    });

    res.json({
      distribution,
      total,
      timeframe,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Sentiment analytics error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get trending keywords with word cloud data
router.get('/keywords', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '7d';
    const limit = parseInt(req.query.limit) || 50;
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const keywordData = await NewsArticle.aggregate([
      {
        $match: {
          publishedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$keyword',
          count: { $sum: 1 },
          latestArticle: { $max: '$publishedAt' },
          sentimentDistribution: {
            $push: '$aiAnalysis.sentiment.label'
          }
        }
      },
      {
        $addFields: {
          positiveCount: {
            $size: {
              $filter: {
                input: '$sentimentDistribution',
                cond: { $eq: ['$$this', 'POSITIVE'] }
              }
            }
          },
          negativeCount: {
            $size: {
              $filter: {
                input: '$sentimentDistribution',
                cond: { $eq: ['$$this', 'NEGATIVE'] }
              }
            }
          },
          neutralCount: {
            $size: {
              $filter: {
                input: '$sentimentDistribution',
                cond: { $eq: ['$$this', 'NEUTRAL'] }
              }
            }
          }
        }
      },
      {
        $sort: { count: -1, latestArticle: -1 }
      },
      {
        $limit: limit
      }
    ]);

    const wordCloud = keywordData.map(item => ({
      text: item._id,
      value: item.count,
      sentiment: {
        positive: item.positiveCount,
        negative: item.negativeCount,
        neutral: item.neutralCount
      }
    }));

    res.json({
      wordCloud,
      timeframe,
      totalKeywords: keywordData.length,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Keywords analytics error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get sentiment trends over time
router.get('/trends', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '7d';
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trendsData = await NewsArticle.aggregate([
      {
        $match: {
          publishedAt: { $gte: startDate }
        }
      },
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
      {
        $sort: { '_id': 1 }
      }
    ]);

    const trends = trendsData.map(day => {
      const sentiments = {
        POSITIVE: 0,
        NEGATIVE: 0,
        NEUTRAL: 0
      };

      day.sentiments.forEach(sentiment => {
        sentiments[sentiment.sentiment] = sentiment.count;
      });

      return {
        date: day._id,
        ...sentiments
      };
    });

    res.json({
      trends,
      timeframe,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Trends analytics error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get search analytics
router.get('/searches', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '7d';
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const searchData = await SearchLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSearches: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          avgProcessingTime: { $avg: '$processingTime' },
          avgResultsCount: { $avg: '$resultsCount' }
        }
      },
      {
        $project: {
          totalSearches: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          avgProcessingTime: { $round: ['$avgProcessingTime', 2] },
          avgResultsCount: { $round: ['$avgResultsCount', 1] }
        }
      }
    ]);

    const topSearches = await SearchLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$keyword',
          count: { $sum: 1 },
          avgResultsCount: { $avg: '$resultsCount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      overview: searchData[0] || {
        totalSearches: 0,
        uniqueUsers: 0,
        avgProcessingTime: 0,
        avgResultsCount: 0
      },
      topSearches,
      timeframe,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Search analytics error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get overall dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '7d';
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all analytics in parallel
    const [
      sentimentData,
      keywordData,
      trendsData,
      searchData
    ] = await Promise.all([
      // Sentiment distribution
      NewsArticle.aggregate([
        { $match: { publishedAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$aiAnalysis.sentiment.label',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Top keywords
      NewsArticle.aggregate([
        { $match: { publishedAt: { $gte: startDate } } },
        { $group: { _id: '$keyword', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Daily trends
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
      
      // Search statistics
      SearchLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        }
      ])
    ]);

    // Process sentiment data
    const sentimentDistribution = {
      POSITIVE: 0,
      NEGATIVE: 0,
      NEUTRAL: 0
    };
    sentimentData.forEach(item => {
      sentimentDistribution[item._id] = item.count;
    });

    // Process trends data
    const trends = trendsData.map(day => {
      const sentiments = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
      day.sentiments.forEach(sentiment => {
        sentiments[sentiment.sentiment] = sentiment.count;
      });
      return { date: day._id, ...sentiments };
    });

    // Process search data
    const searchStats = searchData[0] || {
      totalSearches: 0,
      uniqueUsers: 0
    };

    res.json({
      sentimentDistribution,
      topKeywords: keywordData,
      trends,
      searchStats: {
        totalSearches: searchStats.totalSearches,
        uniqueUsers: searchStats.uniqueUsers?.length || 0
      },
      timeframe,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
