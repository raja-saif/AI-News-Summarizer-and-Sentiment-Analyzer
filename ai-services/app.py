from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_services import NewsSummarizer, SentimentAnalyzer, TextPreprocessor
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize AI services
preprocessor = TextPreprocessor()
summarizer = NewsSummarizer()
sentiment_analyzer = SentimentAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "AI News Summarizer is running"})

@app.route('/summarize', methods=['POST'])
def summarize_article():
    """Summarize news article"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Text content is required"}), 400
        
        text = data['text']
        max_length = data.get('max_length', 150)
        min_length = data.get('min_length', 50)
        
        # Preprocess text
        cleaned_text = preprocessor.clean_text(text)
        
        # Generate summary
        summary = summarizer.summarize(cleaned_text, max_length=max_length, min_length=min_length)
        
        return jsonify({
            "original_text": text[:200] + "..." if len(text) > 200 else text,
            "summary": summary,
            "word_count": len(text.split()),
            "summary_word_count": len(summary.split())
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    """Analyze sentiment of text"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Text content is required"}), 400
        
        text = data['text']
        
        # Preprocess text
        cleaned_text = preprocessor.clean_text(text)
        
        # Analyze sentiment
        sentiment_result = sentiment_analyzer.analyze(cleaned_text)
        
        return jsonify({
            "text": text[:200] + "..." if len(text) > 200 else text,
            "sentiment": sentiment_result['label'],
            "confidence": sentiment_result['score'],
            "sentiment_score": sentiment_result.get('sentiment_score', 0)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/process-news', methods=['POST'])
def process_news():
    """Complete news processing pipeline: summarize + sentiment analysis"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Text content is required"}), 400
        
        text = data['text']
        max_length = data.get('max_length', 150)
        min_length = data.get('min_length', 50)
        
        # Preprocess text
        cleaned_text = preprocessor.clean_text(text)
        
        # Process in parallel (if needed, you can use threading)
        summary = summarizer.summarize(cleaned_text, max_length=max_length, min_length=min_length)
        sentiment_result = sentiment_analyzer.analyze(cleaned_text)
        
        return jsonify({
            "original_text": text[:200] + "..." if len(text) > 200 else text,
            "summary": summary,
            "sentiment": {
                "label": sentiment_result['label'],
                "confidence": sentiment_result['score'],
                "sentiment_score": sentiment_result.get('sentiment_score', 0)
            },
            "word_count": len(text.split()),
            "summary_word_count": len(summary.split())
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/batch-process', methods=['POST'])
def batch_process():
    """Process multiple news articles at once"""
    try:
        data = request.get_json()
        
        if not data or 'articles' not in data:
            return jsonify({"error": "Articles array is required"}), 400
        
        articles = data['articles']
        results = []
        
        for i, article in enumerate(articles):
            try:
                if 'text' not in article:
                    continue
                
                text = article['text']
                title = article.get('title', f'Article {i+1}')
                
                # Preprocess text
                cleaned_text = preprocessor.clean_text(text)
                
                # Process article
                summary = summarizer.summarize(cleaned_text)
                sentiment_result = sentiment_analyzer.analyze(cleaned_text)
                
                results.append({
                    "title": title,
                    "summary": summary,
                    "sentiment": {
                        "label": sentiment_result['label'],
                        "confidence": sentiment_result['score'],
                        "sentiment_score": sentiment_result.get('sentiment_score', 0)
                    },
                    "word_count": len(text.split())
                })
                
            except Exception as e:
                results.append({
                    "title": article.get('title', f'Article {i+1}'),
                    "error": str(e)
                })
        
        return jsonify({
            "processed_count": len(results),
            "total_count": len(articles),
            "results": results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
