import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import List, Dict, Union, Optional
import time
import logging
from ml.config import ml_config

logger = logging.getLogger(__name__)

class SentimentTransformerEngine:
    """
    Singleton Transformer Inference Engine for multi-architecture Sentiment Analysis.
    Supports RoBERTa, DistilBERT, and BERT. Loads models once and caches pipelines.
    Implements true batch inference with PyTorch inference mode.
    """
    _instances: Dict[str, "SentimentTransformerEngine"] = {}

    MODEL_ALIASES = {
        "roberta": "cardiffnlp/twitter-roberta-base-sentiment-latest",
        "cardiffnlp/twitter-roberta-base-sentiment-latest": "cardiffnlp/twitter-roberta-base-sentiment-latest",
        "distilbert": "distilbert-base-uncased-finetuned-sst-2-english",
        "distilbert-base-uncased-finetuned-sst-2-english": "distilbert-base-uncased-finetuned-sst-2-english",
        "bert": "nlptown/bert-base-multilingual-uncased-sentiment",
        "nlptown/bert-base-multilingual-uncased-sentiment": "nlptown/bert-base-multilingual-uncased-sentiment",
    }

    def __init__(self, model_name: str = ml_config.sentiment_model_name):
        resolved_name = self.MODEL_ALIASES.get(model_name.lower().strip() if model_name else "", model_name or ml_config.sentiment_model_name)
        self.model_name = resolved_name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Initializing SentimentTransformerEngine on device: {self.device} for model: {self.model_name}")
        
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
        self.model.to(self.device)
        self.model.eval()
        self.model.requires_grad_(False)
        
        # Determine model output mapping
        self.id2label = self.model.config.id2label
        logger.info(f"Model [{self.model_name}] loaded successfully with labels: {self.id2label}")

    @classmethod
    def get_instance(cls, model_name: Optional[str] = None) -> "SentimentTransformerEngine":
        raw_name = model_name or ml_config.sentiment_model_name
        resolved_name = cls.MODEL_ALIASES.get(raw_name.lower().strip() if raw_name else "", raw_name)
        if resolved_name not in cls._instances:
            cls._instances[resolved_name] = cls(resolved_name)
        return cls._instances[resolved_name]

    def _normalize_sentiment(self, raw_label: str) -> str:
        """
        Normalizes various Hugging Face raw labels (e.g. 'LABEL_0', 'positive', 'POS', '5 stars')
        into canonical 3-class sentiment: 'Positive', 'Negative', 'Neutral'.
        """
        raw_lower = str(raw_label).lower()
        if any(w in raw_lower for w in ["pos", "positive", "4 star", "5 star"]):
            return "Positive"
        elif any(w in raw_lower for w in ["neg", "negative", "1 star", "2 star"]):
            return "Negative"
        elif any(w in raw_lower for w in ["neu", "neutral", "3 star"]):
            return "Neutral"
        
        # Fallback for RoBERTa standard 0: Negative, 1: Neutral, 2: Positive
        if "label_0" in raw_lower or "0" == raw_lower:
            return "Negative"
        elif "label_1" in raw_lower or "1" == raw_lower:
            return "Neutral"
        elif "label_2" in raw_lower or "2" == raw_lower:
            return "Positive"
        return "Neutral"

    @torch.inference_mode()
    def predict_single(self, text: str) -> Dict:
        """
        Runs inference on a single text string.
        """
        results = self.predict_batch([text])
        return results[0]

    @torch.inference_mode()
    def predict_batch(self, texts: List[str], batch_size: int = ml_config.eval_batch_size) -> List[Dict]:
        """
        Runs true batched tensor inference with PyTorch inference mode.
        """
        if not texts:
            return []

        all_results = []
        start_time = time.perf_counter()

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
            logits = outputs.logits
            probs = F.softmax(logits, dim=-1).cpu().numpy()

            for idx, prob_array in enumerate(probs):
                # Calculate class breakdown by summing probability mass across mapped labels
                class_probs = {"Positive": 0.0, "Neutral": 0.0, "Negative": 0.0}
                for class_idx, p in enumerate(prob_array):
                    raw_label = self.id2label.get(class_idx, f"LABEL_{class_idx}")
                    norm_label = self._normalize_sentiment(raw_label)
                    class_probs[norm_label] = class_probs.get(norm_label, 0.0) + float(p)

                # Standardize probabilities across 3 canonical classes
                pos_p = class_probs.get("Positive", 0.0)
                neg_p = class_probs.get("Negative", 0.0)
                neu_p = class_probs.get("Neutral", 0.0)
                total = pos_p + neg_p + neu_p or 1.0

                normalized_probs = {
                    "Positive": round(pos_p / total, 4),
                    "Neutral": round(neu_p / total, 4),
                    "Negative": round(neg_p / total, 4)
                }

                # Top predicted sentiment & confidence from actual model probability
                predicted_sentiment = max(normalized_probs, key=lambda k: normalized_probs[k])
                confidence = normalized_probs[predicted_sentiment]

                logger.debug(
                    f"Inference complete on [{self.model_name}] for text: '{batch_texts[idx][:40]}...' -> "
                    f"Sentiment: {predicted_sentiment}, Confidence: {confidence}, Probabilities: {normalized_probs}"
                )

                all_results.append({
                    "text": batch_texts[idx],
                    "sentiment": predicted_sentiment,
                    "confidence": confidence,
                    "probabilities": normalized_probs,
                    "model_name": self.model_name
                })

        total_time = (time.perf_counter() - start_time) * 1000.0
        per_item_time = round(total_time / len(texts), 2)
        
        for res in all_results:
            res["processing_time_ms"] = per_item_time

        return all_results
