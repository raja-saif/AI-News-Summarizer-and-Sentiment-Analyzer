#!/usr/bin/env python3
"""
Test script for AI services
Run this to test the complete AI pipeline
"""

import sys
import json
from ai_services import TextPreprocessor, NewsSummarizer, SentimentAnalyzer

def test_text_preprocessing():
    """Test text preprocessing functionality"""
    print("=" * 50)
    print("Testing Text Preprocessing")
    print("=" * 50)
    
    preprocessor = TextPreprocessor()
    
    # Test text with various issues
    test_text = """
    This is a sample news article about artificial intelligence. 
    Visit our website at https://example.com for more info.
    Contact us at info@example.com.
    <p>This has HTML tags</p>
    It also has    multiple   spaces and special characters!@#$%^&*()
    """
    
    print("Original text:")
    print(test_text)
    print("\n" + "-" * 30)
    
    # Test cleaning
    cleaned = preprocessor.clean_text(test_text)
    print("Cleaned text:")
    print(cleaned)
    print("\n" + "-" * 30)
    
    # Test keyword extraction
    keywords = preprocessor.extract_keywords(cleaned, max_keywords=5)
    print("Extracted keywords:")
    print(keywords)
    print("\n" + "-" * 30)
    
    # Test sentence extraction
    sentences = preprocessor.extract_sentences(cleaned)
    print("Extracted sentences:")
    for i, sentence in enumerate(sentences, 1):
        print(f"{i}. {sentence}")
    
    print("\n✅ Text preprocessing test completed!")
    return True

def test_sentiment_analysis():
    """Test sentiment analysis functionality"""
    print("\n" + "=" * 50)
    print("Testing Sentiment Analysis")
    print("=" * 50)
    
    analyzer = SentimentAnalyzer()
    
    test_texts = [
        "This is absolutely amazing! I love this new technology.",
        "This is terrible. I hate everything about this.",
        "The weather is okay today. Nothing special.",
        "Artificial intelligence is transforming industries worldwide.",
        "The economy is struggling with high inflation rates."
    ]
    
    print("Analyzing sentiment for test texts:")
    print("-" * 30)
    
    for i, text in enumerate(test_texts, 1):
        print(f"\n{i}. Text: {text}")
        result = analyzer.analyze(text)
        print(f"   Sentiment: {result['label']}")
        print(f"   Confidence: {result['score']:.3f}")
        print(f"   Score: {result['sentiment_score']:.3f}")
    
    print("\n✅ Sentiment analysis test completed!")
    return True

def test_summarization():
    """Test text summarization functionality"""
    print("\n" + "=" * 50)
    print("Testing Text Summarization")
    print("=" * 50)
    
    summarizer = NewsSummarizer()
    
    # Sample news article
    news_article = """
    Artificial intelligence is rapidly transforming the technology landscape, 
    bringing unprecedented changes to industries ranging from healthcare to finance. 
    Recent developments in machine learning algorithms have enabled computers to 
    process and analyze vast amounts of data with remarkable accuracy and speed.
    
    In the healthcare sector, AI-powered diagnostic tools are helping doctors 
    identify diseases earlier and more accurately than ever before. These systems 
    can analyze medical images, patient records, and genetic data to provide 
    personalized treatment recommendations.
    
    The financial industry has also embraced AI for fraud detection, algorithmic 
    trading, and risk assessment. Banks and investment firms are using machine 
    learning models to detect suspicious transactions and optimize their trading 
    strategies in real-time.
    
    However, the rapid adoption of AI also brings challenges. Concerns about job 
    displacement, algorithmic bias, and data privacy have sparked important 
    discussions about the ethical implications of AI technology. Governments and 
    organizations worldwide are working to establish regulations and guidelines 
    to ensure AI is developed and deployed responsibly.
    
    Looking ahead, experts predict that AI will continue to evolve and become 
    even more integrated into our daily lives. The key will be finding the right 
    balance between innovation and responsibility, ensuring that AI serves 
    humanity's best interests while addressing the challenges it presents.
    """
    
    print("Original article length:", len(news_article.split()), "words")
    print("\nOriginal article:")
    print(news_article[:300] + "...")
    print("\n" + "-" * 30)
    
    # Test summarization
    summary = summarizer.summarize(news_article, max_length=100, min_length=30)
    print("Generated summary:")
    print(summary)
    print(f"\nSummary length: {len(summary.split())} words")
    
    print("\n✅ Summarization test completed!")
    return True

def test_complete_pipeline():
    """Test the complete AI pipeline"""
    print("\n" + "=" * 50)
    print("Testing Complete AI Pipeline")
    print("=" * 50)
    
    # Initialize services
    preprocessor = TextPreprocessor()
    summarizer = NewsSummarizer()
    analyzer = SentimentAnalyzer()
    
    # Sample news article
    article = """
    The stock market experienced significant volatility today as investors reacted 
    to the latest economic data. The Dow Jones Industrial Average fell by 200 points, 
    while the S&P 500 declined by 1.5%. Technology stocks were particularly hard hit, 
    with major companies like Apple and Microsoft seeing substantial losses.
    
    Analysts attribute the market downturn to concerns about inflation and potential 
    interest rate hikes by the Federal Reserve. The Consumer Price Index rose by 
    0.3% last month, exceeding expectations and fueling fears of persistent inflation.
    
    Despite the negative sentiment, some experts remain optimistic about the long-term 
    prospects of the economy. They point to strong employment numbers and robust 
    consumer spending as positive indicators for future growth.
    """
    
    print("Processing news article:")
    print(article[:200] + "...")
    print("\n" + "-" * 30)
    
    # Step 1: Preprocess
    print("1. Preprocessing text...")
    cleaned_text = preprocessor.clean_text(article)
    keywords = preprocessor.extract_keywords(cleaned_text, max_keywords=5)
    print(f"   Extracted keywords: {keywords}")
    
    # Step 2: Summarize
    print("\n2. Generating summary...")
    summary = summarizer.summarize(cleaned_text, max_length=80, min_length=30)
    print(f"   Summary: {summary}")
    
    # Step 3: Analyze sentiment
    print("\n3. Analyzing sentiment...")
    sentiment = analyzer.analyze(cleaned_text)
    print(f"   Sentiment: {sentiment['label']} (confidence: {sentiment['score']:.3f})")
    
    # Final result
    print("\n" + "=" * 30)
    print("FINAL RESULT:")
    print("=" * 30)
    result = {
        "original_length": len(article.split()),
        "summary": summary,
        "summary_length": len(summary.split()),
        "sentiment": sentiment,
        "keywords": keywords
    }
    
    print(json.dumps(result, indent=2))
    
    print("\n✅ Complete pipeline test completed!")
    return True

def main():
    """Run all tests"""
    print("🚀 Starting AI Services Test Suite")
    print("This will test all AI components: preprocessing, sentiment analysis, and summarization")
    print("\nNote: First run may take longer as models are downloaded.")
    
    try:
        # Run all tests
        tests = [
            test_text_preprocessing,
            test_sentiment_analysis,
            test_summarization,
            test_complete_pipeline
        ]
        
        passed = 0
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"\n❌ Test failed: {e}")
        
        print("\n" + "=" * 50)
        print(f"TEST SUMMARY: {passed}/{len(tests)} tests passed")
        print("=" * 50)
        
        if passed == len(tests):
            print("🎉 All tests passed! Your AI services are ready to use.")
        else:
            print("⚠️  Some tests failed. Check the errors above.")
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
