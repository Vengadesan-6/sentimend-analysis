"""
Preload script executed during the Render build phase.
Pre-downloads essential transformer models and tokenizers into the local cache
so that no network downloads occur during runtime HTTP requests.
"""
import logging
import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from ml.config import ml_config

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SentixPreload")

def preload_models():
    models = [
        ml_config.sentiment_model_name,
        ml_config.emotion_model_name,
        ml_config.distilbert_model_name,
    ]
    
    dtype = torch.bfloat16 if hasattr(torch, "bfloat16") else torch.float32

    logger.info("Starting model preloading for Render build phase...")
    for model_name in models:
        try:
            logger.info(f"Downloading & caching tokenizer: {model_name}")
            AutoTokenizer.from_pretrained(model_name)
            
            logger.info(f"Downloading & caching model weights: {model_name}")
            AutoModelForSequenceClassification.from_pretrained(model_name, torch_dtype=dtype)
            logger.info(f"Successfully cached {model_name}")
        except Exception as e:
            logger.warning(f"Failed to preload {model_name}: {e}")

    logger.info("Preloading completed successfully.")

if __name__ == "__main__":
    preload_models()
