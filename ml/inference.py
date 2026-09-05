import time
from typing import Dict, List, Optional
from ml.preprocess import clean_text

class SentimentIntelligencePipeline:
    """
    Unified Pipeline orchestrating Sentiment, Emotion, ABSA, and Explainable AI.
    Loads transformer models lazily on first prediction request to ensure instant startup.
    """
    _instance = None

    def __init__(self):
        self._sentiment_engine = None
        self._emotion_engine = None
        self._absa_engine = None
        self._xai_engine = None

    @classmethod
    def get_instance(cls) -> "SentimentIntelligencePipeline":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def sentiment_engine(self):
        if self._sentiment_engine is None:
            from ml.models.sentiment_model import SentimentTransformerEngine
            self._sentiment_engine = SentimentTransformerEngine.get_instance()
        return self._sentiment_engine

    @property
    def emotion_engine(self):
        if self._emotion_engine is None:
            from ml.models.emotion_model import EmotionTransformerEngine
            self._emotion_engine = EmotionTransformerEngine.get_instance()
        return self._emotion_engine

    @property
    def absa_engine(self):
        if self._absa_engine is None:
            from ml.models.absa_engine import AspectSentimentEngine
            self._absa_engine = AspectSentimentEngine.get_instance()
        return self._absa_engine

    @property
    def xai_engine(self):
        if self._xai_engine is None:
            from ml.models.xai_engine import ExplainableAIEngine
            self._xai_engine = ExplainableAIEngine.get_instance()
        return self._xai_engine

    def analyze_single(self, text: str, model_name: Optional[str] = None, include_xai: bool = True) -> Dict:
        """
        Complete end-to-end analysis for a single text.
        """
        start_time = time.perf_counter()
        cleaned = clean_text(text)
        
        # 1. Sentiment Engine (select specific model if requested)
        if model_name:
            from ml.models.sentiment_model import SentimentTransformerEngine
            sent_engine = SentimentTransformerEngine.get_instance(model_name)
        else:
            sent_engine = self.sentiment_engine

        sent_res = sent_engine.predict_single(cleaned)
        
        # 2. Emotion Engine
        emotion_res = self.emotion_engine.predict_single(cleaned)
        
        # 3. ABSA Engine
        aspects = self.absa_engine.analyze_aspects(cleaned, sent_engine)
        
        # 4. Explainable AI
        explanation = self.xai_engine.explain(cleaned, sent_engine) if include_xai else None
        
        total_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        
        return {
            "text": text,
            "cleaned_text": cleaned,
            "sentiment": sent_res["sentiment"],
            "confidence": sent_res["confidence"],
            "probabilities": sent_res["probabilities"],
            "emotion": emotion_res["emotion"],
            "emotion_probabilities": emotion_res["probabilities"],
            "aspects": aspects,
            "explanation": explanation,
            "model_name": sent_engine.model_name,
            "processing_time_ms": total_time_ms
        }

    def analyze_batch(self, texts: List[str], model_name: Optional[str] = None) -> List[Dict]:
        """
        Batched inference for bulk CSV / array processing with batch tokenizer.
        """
        cleaned_texts = [clean_text(t) for t in texts]
        
        if model_name:
            from ml.models.sentiment_model import SentimentTransformerEngine
            sent_engine = SentimentTransformerEngine.get_instance(model_name)
        else:
            sent_engine = self.sentiment_engine
        
        # True batched tensor execution
        sent_batch = sent_engine.predict_batch(cleaned_texts)
        emotion_batch = self.emotion_engine.predict_batch(cleaned_texts)
        
        results = []
        for i in range(len(texts)):
            s_item = sent_batch[i]
            e_item = emotion_batch[i]
            
            # Quick aspect extraction for batch
            aspects = self.absa_engine.analyze_aspects(cleaned_texts[i], sent_engine)
            
            results.append({
                "text": texts[i],
                "cleaned_text": cleaned_texts[i],
                "sentiment": s_item["sentiment"],
                "confidence": s_item["confidence"],
                "probabilities": s_item["probabilities"],
                "emotion": e_item["emotion"],
                "aspects": aspects,
                "model_name": s_item["model_name"],
                "processing_time_ms": s_item.get("processing_time_ms", 10.0)
            })
            
        return results

if __name__ == "__main__":
    print("Testing SentimentIntelligencePipeline...")
    pipeline = SentimentIntelligencePipeline.get_instance()
    sample = "The battery life on this laptop is incredible, but the customer support was terrible and rude."
    res = pipeline.analyze_single(sample)
    print("Result:", res)
