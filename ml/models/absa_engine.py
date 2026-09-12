import re
import logging
from typing import List, Dict, Tuple
from ml.models.sentiment_model import SentimentTransformerEngine

logger = logging.getLogger(__name__)

class AspectSentimentEngine:
    """
    Aspect-Based Sentiment Analysis (ABSA) Engine.
    Uses syntactic dependency parsing and noun-phrase boundary extraction to detect aspect targets,
    isolates supporting context spans, and scores aspect-level sentiment via the Transformer engine.
    """
    _instance = None

    def __init__(self):
        self.nlp = None
        try:
            import spacy
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except Exception:
                from spacy.lang.en import English
                self.nlp = English()
                if "sentencizer" not in self.nlp.pipe_names:
                    self.nlp.add_pipe("sentencizer")
        except Exception as e:
            logger.warning(f"Spacy unavailable ({e}), falling back to regex rules.")

    @classmethod
    def get_instance(cls) -> "AspectSentimentEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def extract_aspect_candidates(self, text: str) -> List[Dict[str, str]]:
        """
        Extracts aspect targets and their supporting syntactic context spans.
        """
        aspects_found = []
        seen_aspects = set()

        if self.nlp is not None:
            doc = self.nlp(text)
            # Strategy 1: Dependency parsing & noun chunks
            if hasattr(doc, "noun_chunks") and doc.has_annotation("DEP"):
                for chunk in doc.noun_chunks:
                    clean_chunk = chunk.text.strip().lower()
                    if chunk.root.pos_ in ["NOUN", "PROPN"] and len(clean_chunk) > 2 and clean_chunk not in ["it", "this", "that", "they", "we", "i", "you"]:
                        sent_span = chunk.sent.text.strip()
                        modifiers = [w.text for w in chunk.root.children if w.pos_ in ["ADJ", "ADV", "VERB"]]
                        aspect_name = chunk.text.strip()
                        
                        if aspect_name.lower() not in seen_aspects:
                            seen_aspects.add(aspect_name.lower())
                            aspects_found.append({
                                "aspect": aspect_name,
                                "span": sent_span,
                                "modifiers": modifiers
                            })
            else:
                for sent in doc.sents:
                    words = re.findall(r'\b[A-Za-z]{3,}\b', sent.text)
                    for w in words:
                        if w.lower() in ["battery", "camera", "screen", "price", "delivery", "support", "performance", "sound", "ui", "build", "quality", "service", "hardware", "software"]:
                            if w.lower() not in seen_aspects:
                                seen_aspects.add(w.lower())
                                aspects_found.append({
                                    "aspect": w,
                                    "span": sent.text.strip(),
                                    "modifiers": []
                                })
        else:
            sentences = re.split(r'(?<=[.!?]) +', text)
            for sent in sentences:
                words = re.findall(r'\b[A-Za-z]{3,}\b', sent)
                for w in words:
                    if w.lower() in ["battery", "camera", "screen", "price", "delivery", "support", "performance", "sound", "ui", "build", "quality", "service", "hardware", "software", "experience", "design"]:
                        if w.lower() not in seen_aspects:
                            seen_aspects.add(w.lower())
                            aspects_found.append({
                                "aspect": w,
                                "span": sent.strip(),
                                "modifiers": []
                            })

        return aspects_found

    def analyze_aspects(self, text: str, sentiment_engine: SentimentTransformerEngine) -> List[Dict]:
        """
        Performs full ABSA on input text, returning aspect term, sentiment, confidence, and context span.
        Uses batched inference on aspect context spans for maximum speed and minimal memory allocations.
        """
        candidates = self.extract_aspect_candidates(text)
        if not candidates:
            main_pred = sentiment_engine.predict_single(text)
            return [{
                "aspect": "Overall Experience",
                "sentiment": main_pred["sentiment"],
                "confidence": main_pred["confidence"],
                "supporting_span": text[:150] + ("..." if len(text) > 150 else "")
            }]

        cand_subset = candidates[:4]
        spans = [cand["span"] for cand in cand_subset]
        preds = sentiment_engine.predict_batch(spans)

        results = []
        for cand, pred in zip(cand_subset, preds):
            results.append({
                "aspect": cand["aspect"].title(),
                "sentiment": pred["sentiment"],
                "confidence": pred["confidence"],
                "supporting_span": cand["span"]
            })

        return results
