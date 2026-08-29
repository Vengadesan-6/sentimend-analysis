import time
from typing import Dict, List, Optional
from ml.models.sentiment_model import SentimentTransformerEngine
from ml.models.emotion_model import EmotionTransformerEngine
from ml.models.absa_engine import AspectSentimentEngine
from ml.models.xai_engine import ExplainableAIEngine
from ml.preprocess import clean_text

class SentimentIntelligencePipeline:
    """
    Unified Pipeline orchestrating Sentiment, Emotion, ABSA, and Explainable AI.
    """
    _instance = None

    def __init__(self):
        self.sentiment_engine = SentimentTransformerEngine.get_instance()
        self.emotion_engine = EmotionTransformerEngine.get_instance()
        self.absa_engine = AspectSentimentEngine.get_instance()
        self.xai_engine = ExplainableAIEngine.get_instance()

    @classmethod
    def get_instance(cls) -> "SentimentIntelligencePipeline":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def analyze_single(self, text: str, model_name: Optional[str] = None, include_xai: bool = True) -> Dict:
        """
        Complete end-to-end analysis for a single text.
        """
        start_time = time.perf_counter()
        cleaned = clean_text(text)
        
        # 1. Sentiment Engine (select specific model if requested)
        sent_engine = SentimentTransformerEngine.get_instance(model_name) if model_name else self.sentiment_engine
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
        sent_engine = SentimentTransformerEngine.get_instance(model_name) if model_name else self.sentiment_engine
        
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
