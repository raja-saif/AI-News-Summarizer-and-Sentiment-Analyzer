#!/usr/bin/env python3
"""
Setup script for AI News Summarizer
This script helps set up the environment and download required models
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if e.stdout:
            print(f"Output: {e.stdout}")
        if e.stderr:
            print(f"Error: {e.stderr}")
        return False

def install_dependencies():
    """Install Python dependencies"""
    print("🔧 Installing Python dependencies...")
    
    commands = [
        ("pip install -r requirements.txt", "Installing Python packages"),
    ]
    
    for command, description in commands:
        if not run_command(command, description):
            return False
    
    return True

def download_nltk_data():
    """Download required NLTK data"""
    print("📚 Downloading NLTK data...")
    
    nltk_commands = [
        "python -c \"import nltk; nltk.download('punkt')\"",
        "python -c \"import nltk; nltk.download('stopwords')\"",
        "python -c \"import nltk; nltk.download('punkt_tab')\""
    ]
    
    for command in nltk_commands:
        if not run_command(command, "Downloading NLTK data"):
            print("⚠️  NLTK data download failed, but continuing...")

def download_spacy_model():
    """Download spaCy English model"""
    print("🌐 Downloading spaCy English model...")
    
    # Try to download the spaCy model
    command = "python -m spacy download en_core_web_sm"
    if not run_command(command, "Downloading spaCy English model"):
        print("⚠️  spaCy model download failed. You can install it manually later with:")
        print("   python -m spacy download en_core_web_sm")

def test_installation():
    """Test if everything is working"""
    print("🧪 Testing installation...")
    
    test_script = """
import sys
try:
    import transformers
    import torch
    import nltk
    import spacy
    print("✅ All core packages imported successfully")
    
    # Test NLTK
    from nltk.corpus import stopwords
    print("✅ NLTK data accessible")
    
    # Test transformers
    from transformers import pipeline
    print("✅ Transformers library working")
    
    print("🎉 Installation test passed!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Test error: {e}")
    sys.exit(1)
"""
    
    return run_command(f'python -c "{test_script}"', "Testing installation")

def create_env_file():
    """Create environment file template"""
    env_content = """# AI News Summarizer Environment Variables
# Copy this file to .env and modify as needed

# Flask Configuration
FLASK_ENV=development
DEBUG=True
PORT=5000

# Model Configuration (optional - uses defaults if not set)
SUMMARIZATION_MODEL=sshleifer/distilbart-cnn-12-6
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english

# GPU Configuration (optional)
# CUDA_VISIBLE_DEVICES=0
"""
    
    if not os.path.exists('.env'):
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ Created .env file template")
    else:
        print("⚠️  .env file already exists, skipping creation")

def main():
    """Main setup function"""
    print("🚀 AI News Summarizer Setup")
    print("=" * 50)
    
    steps = [
        ("Installing dependencies", install_dependencies),
        ("Downloading NLTK data", download_nltk_data),
        ("Downloading spaCy model", download_spacy_model),
        ("Creating environment file", create_env_file),
        ("Testing installation", test_installation)
    ]
    
    completed = 0
    for step_name, step_function in steps:
        print(f"\n📋 Step {completed + 1}: {step_name}")
        print("-" * 30)
        
        if step_function():
            completed += 1
            print(f"✅ {step_name} completed")
        else:
            print(f"❌ {step_name} failed")
            response = input("Continue with remaining steps? (y/n): ").lower()
            if response != 'y':
                break
    
    print("\n" + "=" * 50)
    print(f"SETUP SUMMARY: {completed}/{len(steps)} steps completed")
    print("=" * 50)
    
    if completed == len(steps):
        print("🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Run 'python test_ai_services.py' to test the AI services")
        print("2. Run 'python app.py' to start the Flask server")
        print("3. Visit http://localhost:5000/health to check if the API is running")
    else:
        print("⚠️  Setup completed with some issues.")
        print("Check the errors above and try running the failed steps manually.")

if __name__ == "__main__":
    main()
