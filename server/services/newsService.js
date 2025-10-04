const axios = require('axios');
const cheerio = require('cheerio');
const NewsArticle = require('../models/NewsArticle');

class NewsService {
  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY;
    this.newsApiBaseUrl = process.env.NEWS_API_BASE_URL || 'https://newsapi.org/v2';
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
  }

  async fetchNewsFromAPI(keyword, pageSize = 10) {
    try {
      if (!this.newsApiKey) {
        throw new Error('News API key not configured');
      }

      const response = await axios.get(`${this.newsApiBaseUrl}/everything`, {
        params: {
          q: keyword,
          pageSize: pageSize,
          sortBy: 'publishedAt',
          language: 'en',
          apiKey: this.newsApiKey
        }
      });

      return response.data.articles || [];
    } catch (error) {
      console.error('Error fetching from News API:', error.message);
      throw error;
    }
  }

  async scrapeArticle(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style, nav, header, footer, aside').remove();
      
      // Extract content
      const content = $('article, .article, .content, .post, main').text() || 
                     $('body').text();
      
      // Clean up content
      const cleanedContent = content
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000); // Limit content length

      return cleanedContent;
    } catch (error) {
      console.error('Error scraping article:', error.message);
      return null;
    }
  }

  async processWithAI(article) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/process-news`, {
        text: article.content,
        max_length: 150,
        min_length: 50
      });

      return response.data;
    } catch (error) {
      console.error('Error processing with AI:', error.message);
      // Return fallback analysis
      return {
        summary: article.content.substring(0, 200) + '...',
        sentiment: {
          label: 'NEUTRAL',
          confidence: 0.5,
          sentiment_score: 0
        }
      };
    }
  }

  async searchNews(keyword, userId = null, ipAddress = 'unknown') {
    const startTime = Date.now();
    
    try {
      // Check if we have recent articles for this keyword
      const existingArticles = await NewsArticle.find({
        keyword: keyword.toLowerCase(),
        publishedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).sort({ publishedAt: -1 }).limit(10);

      if (existingArticles.length >= 5) {
        console.log(`Returning cached articles for keyword: ${keyword}`);
        return {
          articles: existingArticles,
          fromCache: true,
          processingTime: Date.now() - startTime
        };
      }

      // Fetch new articles
      const rawArticles = await this.fetchNewsFromAPI(keyword, 10);
      const processedArticles = [];

      for (const article of rawArticles) {
        try {
          // Check if article already exists
          const existing = await NewsArticle.findOne({ url: article.url });
          if (existing) {
            processedArticles.push(existing);
            continue;
          }

          // Scrape full content if description is too short
          let content = article.description || article.content || '';
          if (content.length < 200 && article.url) {
            const scrapedContent = await this.scrapeArticle(article.url);
            if (scrapedContent) {
              content = scrapedContent;
            }
          }

          if (!content || content.length < 50) {
            continue; // Skip articles with insufficient content
          }

          // Process with AI
          const aiAnalysis = await this.processWithAI({ content });

          // Create news article document
          const newsArticle = new NewsArticle({
            title: article.title,
            description: article.description,
            content: content,
            url: article.url,
            source: {
              name: article.source?.name || 'Unknown',
              url: article.url
            },
            publishedAt: new Date(article.publishedAt),
            keyword: keyword.toLowerCase(),
            aiAnalysis: {
              summary: aiAnalysis.summary,
              sentiment: {
                label: aiAnalysis.sentiment.label,
                confidence: aiAnalysis.sentiment.confidence,
                sentimentScore: aiAnalysis.sentiment.sentiment_score
              },
              keywords: [], // Could be extracted from AI service
              processedAt: new Date()
            },
            metadata: {
              wordCount: content.split(' ').length,
              readingTime: Math.ceil(content.split(' ').length / 200),
              category: 'general',
              language: 'en'
            }
          });

          await newsArticle.save();
          processedArticles.push(newsArticle);

        } catch (error) {
          console.error('Error processing article:', error.message);
          continue;
        }
      }

      return {
        articles: processedArticles,
        fromCache: false,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error in searchNews:', error.message);
      throw error;
    }
  }

  async getAnalytics(timeframe = '7d') {
    try {
      const days = parseInt(timeframe.replace('d', ''));
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const analytics = await NewsArticle.aggregate([
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

      const sentimentDistribution = {
        POSITIVE: 0,
        NEGATIVE: 0,
        NEUTRAL: 0
      };

      analytics.forEach(item => {
        sentimentDistribution[item._id] = item.count;
      });

      return {
        sentimentDistribution,
        totalArticles: Object.values(sentimentDistribution).reduce((a, b) => a + b, 0),
        timeframe
      };

    } catch (error) {
      console.error('Error getting analytics:', error.message);
      throw error;
    }
  }

  async getTrendingKeywords(limit = 10) {
    try {
      const trending = await NewsArticle.aggregate([
        {
          $group: {
            _id: '$keyword',
            count: { $sum: 1 },
            latestArticle: { $max: '$publishedAt' }
          }
        },
        {
          $sort: { count: -1, latestArticle: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return trending.map(item => ({
        keyword: item._id,
        count: item.count,
        latestArticle: item.latestArticle
      }));

    } catch (error) {
      console.error('Error getting trending keywords:', error.message);
      throw error;
    }
  }
}

module.exports = new NewsService();
