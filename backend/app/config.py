import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentix AI — Sentiment Intelligence Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "sentiment_platform")
    
    # Models
    SENTIMENT_MODEL_NAME: str = os.getenv("SENTIMENT_MODEL_NAME", "cardiffnlp/twitter-roberta-base-sentiment-latest")
    EMOTION_MODEL_NAME: str = os.getenv("EMOTION_MODEL_NAME", "j-hartmann/emotion-english-distilroberta-base")
    DISTILBERT_MODEL_NAME: str = os.getenv("DISTILBERT_MODEL_NAME", "distilbert-base-uncased-finetuned-sst-2-english")
    BERT_MODEL_NAME: str = os.getenv("BERT_MODEL_NAME", "nlptown/bert-base-multilingual-uncased-sentiment")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
