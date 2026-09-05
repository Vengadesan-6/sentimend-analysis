import os
import json
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore", env_file=".env")

    PROJECT_NAME: str = "Sentix AI — Sentiment Intelligence Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "sentiment_platform")
    
    # Models
    SENTIMENT_MODEL_NAME: str = os.getenv("SENTIMENT_MODEL_NAME", "cardiffnlp/twitter-roberta-base-sentiment-latest")
    EMOTION_MODEL_NAME: str = os.getenv("EMOTION_MODEL_NAME", "j-hartmann/emotion-english-distilroberta-base")
    DISTILBERT_MODEL_NAME: str = os.getenv("DISTILBERT_MODEL_NAME", "distilbert-base-uncased-finetuned-sst-2-english")
    BERT_MODEL_NAME: str = os.getenv("BERT_MODEL_NAME", "nlptown/bert-base-multilingual-uncased-sentiment")
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "https://sentimend-analysis.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

    def get_cors_origins(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS") or self.CORS_ORIGINS
        origins: List[str] = []
        if isinstance(raw, list):
            origins = list(raw)
        elif isinstance(raw, str):
            raw = raw.strip()
            if raw.startswith("[") and raw.endswith("]"):
                try:
                    origins = json.loads(raw)
                except Exception:
                    pass
            if not origins:
                origins = [o.strip() for o in raw.split(",") if o.strip()]
        else:
            origins = ["https://sentimend-analysis.vercel.app"]

        # Ensure real Vercel production domain is always included
        if "https://sentimend-analysis.vercel.app" not in origins:
            origins.append("https://sentimend-analysis.vercel.app")

        # Avoid Starlette AssertionError: Cannot use allow_origins=['*'] with allow_credentials=True
        cleaned = [o for o in origins if o != "*"]
        return cleaned if cleaned else ["https://sentimend-analysis.vercel.app"]

settings = Settings()
