# AI News Summarizer & Sentiment Analyzer

A full-stack web application that fetches the latest news and uses free AI models to summarize articles and classify sentiment. Built with React.js, Node.js, and Python AI services.

## 🚀 Features

### User Features
- **AI-Powered News Search**: Search for news articles by keyword
- **Smart Summarization**: Get 3-4 line AI-generated summaries
- **Sentiment Analysis**: Classify articles as Positive, Negative, or Neutral
- **Interactive Dashboard**: View sentiment distribution and trends
- **Real-time Analytics**: Track keyword popularity and sentiment patterns

### Admin Features
- **User Management**: Manage user accounts and roles
- **Content Management**: Monitor processed articles
- **Analytics Dashboard**: View comprehensive usage statistics
- **System Configuration**: Manage API keys and settings

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React.js      │    │   Node.js       │    │   Python        │
│   Frontend      │◄──►│   Backend       │◄──►│   AI Services   │
│   (Port 3000)   │    │   (Port 3001)   │    │   (Port 5000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   MongoDB       │    │   Hugging Face  │
│   (Port 80)     │    │   (Port 27017)  │    │   Models        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React.js** with TypeScript
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **NewsAPI** for news fetching
- **Cheerio** for web scraping

### AI Services
- **Python Flask** microservice
- **Hugging Face Transformers**
  - DistilBART for summarization
  - DistilBERT for sentiment analysis
- **NLTK & spaCy** for text preprocessing

## 📋 Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB 6.0+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-news-summarizer
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - AI Services: http://localhost:5000

### Option 2: Manual Setup

#### 1. Setup AI Services

```bash
cd ai-services
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python setup.py
python app.py
```

#### 2. Setup Backend

```bash
cd server
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

#### 3. Setup Frontend

```bash
cd client
npm install
npm start
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-news-db
JWT_SECRET=your-super-secret-jwt-key
NEWS_API_KEY=your-news-api-key
AI_SERVICE_URL=http://localhost:5000
```

#### AI Services (.env)
```env
FLASK_ENV=development
PORT=5000
DEBUG=True
```

### API Keys

1. **NewsAPI Key** (Free tier available)
   - Sign up at https://newsapi.org/
   - Get your API key
   - Add to backend .env file

2. **MongoDB Atlas** (Optional)
   - Create a free cluster at https://cloud.mongodb.com/
   - Get connection string
   - Add to backend .env file

## 📊 API Endpoints

### News API
- `POST /api/news/search` - Search news articles
- `GET /api/news/recent` - Get recent articles
- `GET /api/news/sentiment/:sentiment` - Filter by sentiment

### Analytics API
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/sentiment` - Sentiment distribution
- `GET /api/analytics/trends` - Sentiment trends over time

### Admin API
- `GET /api/admin/dashboard` - Admin overview
- `GET /api/admin/users` - User management
- `PUT /api/admin/users/:id/role` - Update user role

### AI Services API
- `POST /summarize` - Summarize text
- `POST /analyze-sentiment` - Analyze sentiment
- `POST /process-news` - Complete processing pipeline

## 🧪 Testing

### Test AI Services
```bash
cd ai-services
python test_ai_services.py
```

### Test Backend
```bash
cd server
npm test
```

### Test Frontend
```bash
cd client
npm test
```

## 📈 Usage Examples

### Search for News
```javascript
const response = await fetch('/api/news/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ keyword: 'artificial intelligence' })
});
const data = await response.json();
```

### Process with AI
```javascript
const response = await fetch('http://localhost:5000/process-news', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Your news article content...',
    max_length: 150
  })
});
const result = await response.json();
```

## 🔧 Development

### Project Structure
```
ai-news-summarizer/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.tsx        # Main app component
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   └── middleware/       # Custom middleware
├── ai-services/          # Python AI microservice
│   ├── ai_services.py    # AI functionality
│   ├── app.py           # Flask application
│   └── test_ai_services.py
└── docker-compose.yml   # Docker configuration
```

### Adding New Features

1. **Frontend**: Add components in `client/src/components/`
2. **Backend**: Add routes in `server/routes/`
3. **AI Services**: Extend functionality in `ai-services/ai_services.py`

### Code Style
- Frontend: ESLint + Prettier
- Backend: ESLint
- AI Services: Black formatter

## 🚀 Deployment

### Production Deployment

1. **Build for production**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Environment setup**
   - Set production environment variables
   - Configure SSL certificates
   - Set up monitoring and logging

3. **Database setup**
   - Create production MongoDB database
   - Run database migrations
   - Set up backups

### Cloud Deployment

#### Heroku
```bash
# Install Heroku CLI
# Create apps for each service
heroku create ai-news-backend
heroku create ai-news-frontend
heroku create ai-news-ai

# Deploy each service
git subtree push --prefix server heroku-backend main
git subtree push --prefix client heroku-frontend main
git subtree push --prefix ai-services heroku-ai main
```

#### AWS/GCP/Azure
- Use container services (ECS, Cloud Run, Container Instances)
- Set up load balancers
- Configure auto-scaling
- Set up monitoring

## 🔒 Security

- JWT authentication
- Rate limiting
- Input validation
- CORS configuration
- Environment variable protection
- SQL injection prevention (MongoDB)

## 📊 Monitoring

### Health Checks
- Frontend: Built-in React health check
- Backend: `/health` endpoint
- AI Services: `/health` endpoint
- Database: MongoDB connection check

### Logging
- Structured logging with timestamps
- Error tracking and reporting
- Performance monitoring
- User activity tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

1. **AI Models not loading**
   - Check internet connection
   - Verify Hugging Face access
   - Check Python dependencies

2. **Database connection issues**
   - Verify MongoDB is running
   - Check connection string
   - Verify network access

3. **News API errors**
   - Check API key validity
   - Verify rate limits
   - Check API quota

### Getting Help

- Check the documentation
- Review error logs
- Create an issue on GitHub
- Contact the development team

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic news search and summarization
- ✅ Sentiment analysis
- ✅ User authentication
- ✅ Admin dashboard

### Phase 2 (Planned)
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] API rate limiting
- [ ] Mobile app

### Phase 3 (Future)
- [ ] Multi-language support
- [ ] Custom AI models
- [ ] Real-time news streaming
- [ ] Advanced ML features

---

**Built with ❤️ using modern web technologies and AI**
