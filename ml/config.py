import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
RAW_DATA_DIR = DATASET_DIR / "raw"
PROCESSED_DATA_DIR = DATASET_DIR / "processed"
MODELS_DIR = BASE_DIR / "ml" / "saved_models"

# Ensure directories exist
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

class MLConfig(BaseModel):
    # Model checkpoints
    sentiment_model_name: str = os.getenv("SENTIMENT_MODEL_NAME", "cardiffnlp/twitter-roberta-base-sentiment-latest")
    distilbert_model_name: str = os.getenv("DISTILBERT_MODEL_NAME", "distilbert-base-uncased-finetuned-sst-2-english")
    bert_model_name: str = os.getenv("BERT_MODEL_NAME", "nlptown/bert-base-multilingual-uncased-sentiment")
    emotion_model_name: str = os.getenv("EMOTION_MODEL_NAME", "j-hartmann/emotion-english-distilroberta-base")
    
    # Training & Fine-Tuning Hyperparameters
    max_length: int = int(os.getenv("MAX_SEQUENCE_LENGTH", "256"))
    batch_size: int = int(os.getenv("BATCH_SIZE", "16"))
    eval_batch_size: int = 32
    learning_rate: float = 2e-5
    num_epochs: int = 3
    warmup_ratio: float = 0.1
    weight_decay: float = 0.01
    seed: int = 42
    
    # Supported Sentiments (3-class standardized)
    label_map_3class: dict = {
        0: "Negative",
        1: "Neutral",
        2: "Positive"
    }
    
    # Supported Emotions (7-class standardized)
    emotion_labels: list = [
        "joy", "sadness", "anger", "fear", "surprise", "disgust", "neutral"
    ]
    
    # MongoDB
    mongodb_url: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name: str = os.getenv("DATABASE_NAME", "sentiment_platform")

ml_config = MLConfig()
