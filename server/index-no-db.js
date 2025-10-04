const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('dev'));

// AI Service URL
const AI_SERVICE_URL = 'http://localhost:5000';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'development',
    version: '1.0.0'
  });
});

// Mock news search endpoint (without database)
app.post('/api/news/search', async (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    // Mock news data for demonstration
    const mockArticles = [
      {
        _id: '1',
        title: `${keyword} Technology Advances Rapidly in 2024`,
        description: `Recent developments in ${keyword} technology are transforming industries worldwide, with significant breakthroughs in artificial intelligence and machine learning applications.`,
        content: `The ${keyword} sector has experienced unprecedented growth this year, with major companies investing billions in research and development. These advances are expected to revolutionize how we interact with technology in the coming years.`,
        url: `https://example.com/news/${keyword.toLowerCase()}-advances`,
        source: {
          name: 'Tech News Daily',
          url: 'https://technews.com'
        },
        publishedAt: new Date().toISOString(),
        keyword: keyword.toLowerCase(),
        aiAnalysis: {
          summary: `Recent ${keyword} developments show promising growth with significant industry investments and technological breakthroughs expected to impact multiple sectors.`,
          sentiment: {
            label: 'POSITIVE',
            confidence: 0.85,
            sentimentScore: 0.85
          },
          keywords: [keyword.toLowerCase(), 'technology', 'innovation', 'growth'],
          processedAt: new Date().toISOString()
        },
        metadata: {
          wordCount: 45,
          readingTime: 1,
          category: 'technology',
          language: 'en'
        }
      },
      {
        _id: '2',
        title: `Market Analysis: ${keyword} Sector Performance`,
        description: `Financial experts analyze the current performance of ${keyword} related stocks and market trends affecting the industry.`,
        content: `The ${keyword} market has shown mixed results this quarter, with some companies outperforming expectations while others face challenges. Investors remain cautiously optimistic about long-term prospects.`,
        url: `https://example.com/market/${keyword.toLowerCase()}-analysis`,
        source: {
          name: 'Financial Times',
          url: 'https://financialtimes.com'
        },
        publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        keyword: keyword.toLowerCase(),
        aiAnalysis: {
          summary: `${keyword} market shows mixed quarterly results with cautious investor optimism despite some company challenges.`,
          sentiment: {
            label: 'NEUTRAL',
            confidence: 0.72,
            sentimentScore: 0.1
          },
          keywords: [keyword.toLowerCase(), 'market', 'stocks', 'investment'],
          processedAt: new Date().toISOString()
        },
        metadata: {
          wordCount: 38,
          readingTime: 1,
          category: 'business',
          language: 'en'
        }
      },
      {
        _id: '3',
        title: `Challenges Facing ${keyword} Industry in Current Economic Climate`,
        description: `Industry leaders discuss the obstacles and difficulties encountered in the ${keyword} sector during recent economic uncertainties.`,
        content: `The ${keyword} industry faces numerous challenges including supply chain disruptions, regulatory changes, and economic headwinds that are impacting growth and profitability across the sector.`,
        url: `https://example.com/challenges/${keyword.toLowerCase()}-industry`,
        source: {
          name: 'Business Weekly',
          url: 'https://businessweekly.com'
        },
        publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        keyword: keyword.toLowerCase(),
        aiAnalysis: {
          summary: `${keyword} industry encounters significant challenges including supply chain issues, regulatory changes, and economic difficulties affecting sector growth.`,
          sentiment: {
            label: 'NEGATIVE',
            confidence: 0.78,
            sentimentScore: -0.78
          },
          keywords: [keyword.toLowerCase(), 'challenges', 'economy', 'industry'],
          processedAt: new Date().toISOString()
        },
        metadata: {
          wordCount: 42,
          readingTime: 1,
          category: 'business',
          language: 'en'
        }
      }
    ];

    // Try to get real AI analysis if AI service is available
    let processedArticles = mockArticles;
    
    try {
      // Check if AI service is available
      await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 2000 });
      
      // Process articles with AI if available
      processedArticles = await Promise.all(mockArticles.map(async (article) => {
        try {
          const aiResponse = await axios.post(`${AI_SERVICE_URL}/process-news`, {
            text: article.content,
            max_length: 100,
            min_length: 30
          }, { timeout: 10000 });

          return {
            ...article,
            aiAnalysis: {
              summary: aiResponse.data.summary,
              sentiment: aiResponse.data.sentiment,
              keywords: [],
              processedAt: new Date().toISOString()
            }
          };
        } catch (error) {
          console.error('AI processing error for article:', error.message);
          return article; // Return original article if AI fails
        }
      }));
    } catch (error) {
      console.log('AI service not available, using mock data');
    }

    res.json({
      keyword,
      articles: processedArticles,
      totalCount: processedArticles.length,
      fromCache: false,
      processingTime: Math.floor(Math.random() * 1000) + 500
    });

  } catch (error) {
    console.error('News search error:', error.message);
    res.status(500).json({ 
      error: 'Failed to search news',
      message: 'Internal server error'
    });
  }
});

// Mock analytics endpoint
app.get('/api/analytics/dashboard', (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    const mockData = {
      sentimentDistribution: {
        POSITIVE: 45,
        NEGATIVE: 25,
        NEUTRAL: 30
      },
      topKeywords: [
        { _id: 'artificial intelligence', count: 15 },
        { _id: 'technology', count: 12 },
        { _id: 'innovation', count: 10 },
        { _id: 'machine learning', count: 8 },
        { _id: 'automation', count: 6 }
      ],
      trends: [
        { date: '2024-01-01', POSITIVE: 12, NEGATIVE: 8, NEUTRAL: 10 },
        { date: '2024-01-02', POSITIVE: 15, NEGATIVE: 6, NEUTRAL: 9 },
        { date: '2024-01-03', POSITIVE: 18, NEGATIVE: 11, NEUTRAL: 11 },
        { date: '2024-01-04', POSITIVE: 14, NEGATIVE: 9, NEUTRAL: 12 },
        { date: '2024-01-05', POSITIVE: 16, NEGATIVE: 7, NEUTRAL: 13 }
      ],
      searchStats: {
        totalSearches: 156,
        uniqueUsers: 23
      },
      timeframe,
      generatedAt: new Date().toISOString()
    };

    res.json(mockData);
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: development`);
  console.log(`🌐 Frontend URL: http://localhost:3000`);
  console.log(`🤖 AI Service URL: ${AI_SERVICE_URL}`);
  console.log(`📝 Note: Running without database - using mock data`);
});
