<<<<<<< HEAD
=======
# AI-News-Summarizer-and-Sentiment-Analyzer
AI-powered Flask service for real-time news summarization and sentiment analysis using Hugging Face NLP models.
>>>>>>> 12bb5a9d270d526149505790d0ac7e22882703db
# AI News Summarizer & Sentiment Analyzer - AI Services

This module provides the AI services component for the News Summarizer & Sentiment Analyzer project. It implements text preprocessing, summarization, and sentiment analysis using free Hugging Face models.

## 🚀 Features

- **Text Preprocessing**: Clean and prepare text using NLTK and spaCy
- **News Summarization**: Generate concise summaries using DistilBART
- **Sentiment Analysis**: Classify sentiment as Positive, Negative, or Neutral using DistilBERT
- **REST API**: Flask-based API endpoints for easy integration
- **Batch Processing**: Process multiple articles at once

## 📋 Requirements

- Python 3.8+
- CUDA-compatible GPU (optional, for faster inference)

## 🛠️ Installation

### Quick Setup

1. **Clone and navigate to the project directory**
2. **Run the setup script**:
   ```bash
   python setup.py
   ```

### Manual Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Download NLTK data**:
   ```bash
   python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('punkt_tab')"
   ```

3. **Download spaCy model**:
   ```bash
   python -m spacy download en_core_web_sm
   ```

## 🧪 Testing

Run the test suite to verify everything is working:

```bash
python test_ai_services.py
```

This will test:
- Text preprocessing functionality
- Sentiment analysis
- Text summarization
- Complete pipeline integration

## 🚀 Running the API Server

Start the Flask server:

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```http
GET /health
```

### Summarize Text
```http
POST /summarize
Content-Type: application/json

{
    "text": "Your news article text here...",
    "max_length": 150,
    "min_length": 50
}
```

### Analyze Sentiment
```http
POST /analyze-sentiment
Content-Type: application/json

{
    "text": "Your text to analyze..."
}
```

### Complete Processing
```http
POST /process-news
Content-Type: application/json

{
    "text": "Your news article text here...",
    "max_length": 150,
    "min_length": 50
}
```

### Batch Processing
```http
POST /batch-process
Content-Type: application/json

{
    "articles": [
        {
            "title": "Article 1",
            "text": "Article content..."
        },
        {
            "title": "Article 2", 
            "text": "Another article..."
        }
    ]
}
```

## 🔧 Configuration

Create a `.env` file to customize settings:

```env
# Flask Configuration
FLASK_ENV=development
DEBUG=True
PORT=5000

# Model Configuration
SUMMARIZATION_MODEL=sshleifer/distilbart-cnn-12-6
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
```

## 🧠 AI Models Used

### Summarization
- **Primary**: `sshleifer/distilbart-cnn-12-6` (DistilBART)
- **Fallback**: Default Hugging Face summarization model
- **Extractive Fallback**: NLTK-based sentence ranking

### Sentiment Analysis
- **Primary**: `distilbert-base-uncased-finetuned-sst-2-english` (DistilBERT)
- **Fallback**: Default Hugging Face sentiment model

### Text Preprocessing
- **NLTK**: Tokenization, stopwords, sentence segmentation
- **spaCy**: Advanced NLP processing (if available)

## 📊 Response Format

### Summarization Response
```json
{
    "original_text": "First 200 chars...",
    "summary": "Generated summary...",
    "word_count": 150,
    "summary_word_count": 25
}
```

### Sentiment Analysis Response
```json
{
    "text": "First 200 chars...",
    "sentiment": {
        "label": "POSITIVE",
        "confidence": 0.95,
        "sentiment_score": 0.95
    }
}
```

### Complete Processing Response
```json
{
    "original_text": "First 200 chars...",
    "summary": "Generated summary...",
    "sentiment": {
        "label": "POSITIVE",
        "confidence": 0.95,
        "sentiment_score": 0.95
    },
    "word_count": 150,
    "summary_word_count": 25
}
```

## 🔍 Sentiment Labels

- **POSITIVE**: `sentiment_score > 0.1`
- **NEGATIVE**: `sentiment_score < -0.1`
- **NEUTRAL**: `-0.1 <= sentiment_score <= 0.1`

## 🎨 Frontend Integration

### Sentiment Colors
```javascript
const sentimentColors = {
    "POSITIVE": "#10B981",  // Green
    "NEGATIVE": "#EF4444",  // Red
    "NEUTRAL": "#6B7280"    // Gray
};
```

### Sentiment Emojis
```javascript
const sentimentEmojis = {
    "POSITIVE": "😊",
    "NEGATIVE": "😞", 
    "NEUTRAL": "😐"
};
```

## 🚨 Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Missing or invalid input
- **500 Internal Server Error**: Processing errors
- **Graceful Fallbacks**: Extractive summarization if neural models fail

## 📈 Performance Notes

- **First Request**: Slower due to model loading
- **GPU Acceleration**: Automatic if CUDA is available
- **Memory Usage**: ~2-4GB RAM for models
- **Processing Time**: 1-5 seconds per article (depending on length)

## 🔧 Troubleshooting

### Common Issues

1. **Model Download Fails**: Check internet connection and Hugging Face access
2. **CUDA Out of Memory**: Use CPU mode by setting `CUDA_VISIBLE_DEVICES=""`
3. **spaCy Model Missing**: Run `python -m spacy download en_core_web_sm`
4. **NLTK Data Missing**: Run the setup script or download manually

### Debug Mode

Set `DEBUG=True` in your `.env` file for detailed error messages.

## 🤝 Integration with Main Project

This AI service can be integrated with your main Node.js application:

```javascript
// Example Node.js integration
const response = await fetch('http://localhost:5000/process-news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        text: newsArticle.content,
        max_length: 100
    })
});

const result = await response.json();
console.log('Summary:', result.summary);
console.log('Sentiment:', result.sentiment.label);
```

## 📝 License

This project uses open-source models and libraries. Please check individual model licenses on Hugging Face.

## 🆘 Support

If you encounter issues:

1. Check the test suite: `python test_ai_services.py`
2. Verify model downloads
3. Check system requirements
4. Review error logs with `DEBUG=True`
