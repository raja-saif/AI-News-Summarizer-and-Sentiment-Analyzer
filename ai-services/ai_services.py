import re
import string
import nltk
import spacy
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForSequenceClassification
import torch
from typing import Dict, List, Optional, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TextPreprocessor:
    """Text preprocessing using NLTK and spaCy"""
    
    def __init__(self):
        self.nlp = None
        self._setup_nltk()
        self._setup_spacy()
    
    def _setup_nltk(self):
        """Download required NLTK data"""
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
        
        try:
            nltk.data.find('tokenizers/punkt_tab')
        except LookupError:
            nltk.download('punkt_tab')
        
        from nltk.corpus import stopwords
        self.stop_words = set(stopwords.words('english'))
        logger.info("NLTK setup completed")
    
    def _setup_spacy(self):
        """Setup spaCy model"""
        try:
            # Try to load the English model
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy model loaded successfully")
        except OSError:
            logger.warning("spaCy English model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
    
    def clean_text(self, text: str) -> str:
        """Clean and preprocess text"""
        if not text or not isinstance(text, str):
            return ""
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-]', '', text)
        
        return text
    
    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract keywords using spaCy if available, otherwise use simple frequency"""
        if not text:
            return []
        
        cleaned_text = self.clean_text(text)
        
        if self.nlp:
            # Use spaCy for advanced keyword extraction
            doc = self.nlp(cleaned_text)
            
            # Extract nouns, proper nouns, and adjectives
            keywords = []
            for token in doc:
                if (token.pos_ in ['NOUN', 'PROPN', 'ADJ'] and 
                    not token.is_stop and 
                    not token.is_punct and 
                    len(token.text) > 2):
                    keywords.append(token.lemma_.lower())
            
            # Count frequency
            from collections import Counter
            keyword_counts = Counter(keywords)
            
            return [kw for kw, count in keyword_counts.most_common(max_keywords)]
        
        else:
            # Fallback to simple word frequency
            words = cleaned_text.lower().split()
            words = [word for word in words if word not in self.stop_words and len(word) > 2]
            
            from collections import Counter
            word_counts = Counter(words)
            
            return [word for word, count in word_counts.most_common(max_keywords)]
    
    def extract_sentences(self, text: str) -> List[str]:
        """Extract sentences from text"""
        if not text:
            return []
        
        cleaned_text = self.clean_text(text)
        
        if self.nlp:
            doc = self.nlp(cleaned_text)
            return [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 10]
        else:
            # Fallback using NLTK
            from nltk.tokenize import sent_tokenize
            sentences = sent_tokenize(cleaned_text)
            return [sent.strip() for sent in sentences if len(sent.strip()) > 10]

class NewsSummarizer:
    """News summarization using Hugging Face models"""
    
    def __init__(self, model_name: str = "facebook/bart-large-cnn"):
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.summarizer_pipeline = None
        self._load_model()
    
    def _load_model(self):
        """Load the summarization model"""
        try:
            # Try to use a smaller model first for faster loading
            try:
                # Use DistilBART for faster inference
                self.summarizer_pipeline = pipeline(
                    "summarization", 
                    model="sshleifer/distilbart-cnn-12-6",
                    tokenizer="sshleifer/distilbart-cnn-12-6",
                    device=0 if torch.cuda.is_available() else -1
                )
                logger.info("Loaded DistilBART model for summarization")
            except Exception as e:
                logger.warning(f"Failed to load DistilBART, trying default model: {e}")
                # Fallback to default model
                self.summarizer_pipeline = pipeline(
                    "summarization",
                    device=0 if torch.cuda.is_available() else -1
                )
                logger.info("Loaded default summarization model")
                
        except Exception as e:
            logger.error(f"Failed to load summarization model: {e}")
            self.summarizer_pipeline = None
    
    def summarize(self, text: str, max_length: int = 150, min_length: int = 50) -> str:
        """Summarize the given text"""
        if not text or not self.summarizer_pipeline:
            return "Unable to generate summary."
        
        try:
            # Clean and prepare text
            cleaned_text = text.strip()
            
            # Check if text is too short
            if len(cleaned_text.split()) < 10:
                return cleaned_text
            
            # Truncate text if too long (most models have input limits)
            max_input_length = 1024
            words = cleaned_text.split()
            if len(words) > max_input_length:
                cleaned_text = ' '.join(words[:max_input_length])
            
            # Generate summary
            result = self.summarizer_pipeline(
                cleaned_text,
                max_length=max_length,
                min_length=min_length,
                do_sample=False
            )
            
            summary = result[0]['summary_text'].strip()
            return summary
            
        except Exception as e:
            logger.error(f"Error in summarization: {e}")
            # Fallback to extractive summary
            return self._extractive_summary(text, max_length)
    
    def _extractive_summary(self, text: str, max_sentences: int = 3) -> str:
        """Fallback extractive summarization"""
        try:
            from nltk.tokenize import sent_tokenize
            sentences = sent_tokenize(text)
            
            if len(sentences) <= max_sentences:
                return text
            
            # Simple ranking by sentence length and position
            scored_sentences = []
            for i, sentence in enumerate(sentences):
                score = len(sentence.split()) + (len(sentences) - i) * 0.1
                scored_sentences.append((score, sentence))
            
            # Sort by score and take top sentences
            scored_sentences.sort(key=lambda x: x[0], reverse=True)
            top_sentences = [sent for _, sent in scored_sentences[:max_sentences]]
            
            return ' '.join(top_sentences)
            
        except Exception as e:
            logger.error(f"Error in extractive summarization: {e}")
            return text[:200] + "..." if len(text) > 200 else text

class SentimentAnalyzer:
    """Sentiment analysis using Hugging Face models"""
    
    def __init__(self, model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"):
        self.model_name = model_name
        self.sentiment_pipeline = None
        self._load_model()
    
    def _load_model(self):
        """Load the sentiment analysis model"""
        try:
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=self.model_name,
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info(f"Loaded {self.model_name} for sentiment analysis")
            
        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            try:
                # Fallback to default sentiment model
                self.sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    device=0 if torch.cuda.is_available() else -1
                )
                logger.info("Loaded default sentiment analysis model")
            except Exception as e2:
                logger.error(f"Failed to load any sentiment model: {e2}")
                self.sentiment_pipeline = None
    
    def analyze(self, text: str) -> Dict[str, any]:
        """Analyze sentiment of the given text"""
        if not text or not self.sentiment_pipeline:
            return {
                "label": "NEUTRAL",
                "score": 0.5,
                "sentiment_score": 0
            }
        
        try:
            # Clean text
            cleaned_text = text.strip()
            
            if len(cleaned_text.split()) < 2:
                return {
                    "label": "NEUTRAL",
                    "score": 0.5,
                    "sentiment_score": 0
                }
            
            # Truncate if too long
            max_length = 512
            words = cleaned_text.split()
            if len(words) > max_length:
                cleaned_text = ' '.join(words[:max_length])
            
            # Analyze sentiment
            result = self.sentiment_pipeline(cleaned_text)
            
            # Process result
            sentiment_data = result[0]
            label = sentiment_data['label'].upper()
            score = sentiment_data['score']
            
            # Convert to our sentiment scale
            if label == 'POSITIVE':
                sentiment_score = score
            elif label == 'NEGATIVE':
                sentiment_score = -score
            else:
                sentiment_score = 0
            
            # Map to our labels
            if sentiment_score > 0.1:
                final_label = "POSITIVE"
            elif sentiment_score < -0.1:
                final_label = "NEGATIVE"
            else:
                final_label = "NEUTRAL"
                score = 0.5  # Neutral confidence
            
            return {
                "label": final_label,
                "score": score,
                "sentiment_score": sentiment_score
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return {
                "label": "NEUTRAL",
                "score": 0.5,
                "sentiment_score": 0
            }
    
    def batch_analyze(self, texts: List[str]) -> List[Dict[str, any]]:
        """Analyze sentiment for multiple texts"""
        results = []
        
        for text in texts:
            try:
                result = self.analyze(text)
                results.append(result)
            except Exception as e:
                logger.error(f"Error analyzing text: {e}")
                results.append({
                    "label": "NEUTRAL",
                    "score": 0.5,
                    "sentiment_score": 0
                })
        
        return results

# Utility functions for the main application
def get_sentiment_color(sentiment: str) -> str:
    """Get color for sentiment badge"""
    colors = {
        "POSITIVE": "#10B981",  # Green
        "NEGATIVE": "#EF4444",  # Red
        "NEUTRAL": "#6B7280"    # Gray
    }
    return colors.get(sentiment.upper(), "#6B7280")

def get_sentiment_emoji(sentiment: str) -> str:
    """Get emoji for sentiment"""
    emojis = {
        "POSITIVE": "😊",
        "NEGATIVE": "😞",
        "NEUTRAL": "😐"
    }
    return emojis.get(sentiment.upper(), "😐")
