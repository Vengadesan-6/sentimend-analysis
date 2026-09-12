import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import List, Dict, Optional
import time
import logging
import gc
from ml.config import ml_config

logger = logging.getLogger(__name__)

def cleanup_memory():
    """Forces Python garbage collection and OS memory release via malloc_trim."""
    gc.collect()
    try:
        import ctypes
        ctypes.CDLL("libc.so.6").malloc_trim(0)
    except Exception:
        pass

class EmotionTransformerEngine:
    """
    Singleton Transformer Inference Engine for Multi-Class Emotion Detection.
    Maps fine-grained affective states: Joy, Sadness, Anger, Fear, Surprise, Disgust, Neutral.
    """
    _instance: Optional["EmotionTransformerEngine"] = None

    def __init__(self, model_name: str = ml_config.emotion_model_name):
        self.model_name = model_name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Initializing EmotionTransformerEngine on device: {self.device} for model: {model_name}")
        
        dtype = torch.bfloat16 if hasattr(torch, "bfloat16") else torch.float32
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name, torch_dtype=dtype)
        self.model.to(self.device)
        self.model.eval()
        self.model.requires_grad_(False)
        self.id2label = self.model.config.id2label
        cleanup_memory()

    @classmethod
    def get_instance(cls) -> "EmotionTransformerEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def clear_instance(cls):
        if cls._instance is not None:
            cls._instance = None
            cleanup_memory()

    @torch.inference_mode()
    def predict_single(self, text: str) -> Dict:
        results = self.predict_batch([text])
        return results[0]

    @torch.inference_mode()
    def predict_batch(self, texts: List[str], batch_size: int = ml_config.eval_batch_size) -> List[Dict]:
        if not texts:
            return []

        all_results = []
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            encoded = self.tokenizer(
                batch_texts,
                padding=True,
                truncation=True,
                max_length=ml_config.max_length,
                return_tensors="pt"
            )
            encoded = {k: v.to(self.device) for k, v in encoded.items()}
            
            outputs = self.model(**encoded)
            probs = F.softmax(outputs.logits.float(), dim=-1).cpu().numpy()
            
            del outputs
            del encoded

            for idx, prob_array in enumerate(probs):
                raw_scores = {}
                for class_idx, p in enumerate(prob_array):
                    label = self.id2label.get(class_idx, f"emotion_{class_idx}").lower()
                    raw_scores[label] = round(float(p), 4)

                top_emotion = max(raw_scores, key=lambda k: raw_scores[k])
                confidence = raw_scores[top_emotion]

                all_results.append({
                    "emotion": top_emotion.capitalize(),
                    "confidence": confidence,
                    "probabilities": raw_scores
                })

        cleanup_memory()
        return all_results
