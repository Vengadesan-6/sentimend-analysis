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
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.model.to(self.device)
        self.model.eval()
        for param in self.model.parameters():
            param.requires_grad = False
        self.id2label = getattr(self.model.config, "id2label", {})
        cleanup_memory()

    @classmethod
    def get_instance(cls) -> "EmotionTransformerEngine":
        if cls._instance is None:
            try:
                cls._instance = cls()
            except Exception as e:
                logger.warning(f"Could not load EmotionTransformerEngine: {e}")
                cls._instance = None
        return cls._instance

    @classmethod
    def clear_instance(cls):
        if cls._instance is not None:
            cls._instance = None
            cleanup_memory()

    def predict_single(self, text: str) -> Dict:
        """
        Runs inference on a single text string using eval() and torch.no_grad().
        """
        with torch.no_grad():
            self.model.eval()
            results = self.predict_batch([text])
            return results[0]

    def predict_batch(self, texts: List[str], batch_size: int = ml_config.eval_batch_size) -> List[Dict]:
        """
        Runs true batched tensor inference with PyTorch torch.no_grad() and eval().
        """
        if not texts:
            return []

        default_result = {
            "emotion": "Neutral",
            "confidence": 0.5,
            "probabilities": {"neutral": 0.5, "joy": 0.1, "sadness": 0.1, "anger": 0.1, "surprise": 0.1, "fear": 0.05, "disgust": 0.05}
        }

        try:
            self.model.eval()
            all_results = []
            with torch.no_grad():
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

                        top_emotion = max(raw_scores, key=lambda k: raw_scores[k]) if raw_scores else "neutral"
                        confidence = raw_scores.get(top_emotion, 0.5)

                        all_results.append({
                            "emotion": top_emotion.capitalize(),
                            "confidence": confidence,
                            "probabilities": raw_scores
                        })

            cleanup_memory()
            return all_results
        except Exception as e:
            logger.warning(f"Emotion prediction failed: {e}. Returning fallback emotion.")
            cleanup_memory()
            return [default_result for _ in texts]
