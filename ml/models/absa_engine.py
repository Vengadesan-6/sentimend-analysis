import re
import spacy
from typing import List, Dict, Tuple
from ml.models.sentiment_model import SentimentTransformerEngine

class AspectSentimentEngine:
    """
    Aspect-Based Sentiment Analysis (ABSA) Engine.
    Uses syntactic dependency parsing and noun-phrase boundary extraction to detect aspect targets,
    isolates supporting context spans, and scores aspect-level sentiment via the Transformer engine.
    """
    _instance = None

    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            # Fallback to simple English parser if en_core_web_sm model isn't pre-downloaded
            from spacy.lang.en import English
            self.nlp = English()
            if "sentencizer" not in self.nlp.pipe_names:
                self.nlp.add_pipe("sentencizer")

    @classmethod
    def get_instance(cls) -> "AspectSentimentEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def extract_aspect_candidates(self, text: str) -> List[Dict[str, str]]:
        """
        Extracts aspect targets and their supporting syntactic context spans.
        """
        doc = self.nlp(text)
        aspects_found = []
        seen_aspects = set()

        # Strategy 1: Dependency parsing & noun chunks
        if hasattr(doc, "noun_chunks") and doc.has_annotation("DEP"):
            for chunk in doc.noun_chunks:
                # Filter out pure pronouns or stopwords
                clean_chunk = chunk.text.strip().lower()
                if chunk.root.pos_ in ["NOUN", "PROPN"] and len(clean_chunk) > 2 and clean_chunk not in ["it", "this", "that", "they", "we", "i", "you"]:
                    # Find supporting span (the sentence or modifier subclause containing the aspect)
                    sent_span = chunk.sent.text.strip()
                    
                    # Extract surrounding modifier tokens
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
            # Fallback for lightweight rule-based sentence segmentation & noun candidate extraction
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

        return aspects_found

    def analyze_aspects(self, text: str, sentiment_engine: SentimentTransformerEngine) -> List[Dict]:
        """
        Performs full ABSA on input text, returning aspect term, sentiment, confidence, and context span.
        """
        candidates = self.extract_aspect_candidates(text)
        if not candidates:
            # If no explicit aspect target found, provide general text aspect
            main_pred = sentiment_engine.predict_single(text)
            return [{
                "aspect": "Overall Experience",
                "sentiment": main_pred["sentiment"],
                "confidence": main_pred["confidence"],
                "supporting_span": text[:150] + ("..." if len(text) > 150 else "")
            }]

        results = []
        for cand in candidates[:6]:  # Limit to top 6 relevant aspects per text
            span_text = cand["span"]
            aspect_name = cand["aspect"]
            
            # Predict sentiment on the aspect's contextual supporting span
            pred = sentiment_engine.predict_single(span_text)
            
            results.append({
                "aspect": aspect_name.title(),
                "sentiment": pred["sentiment"],
                "confidence": pred["confidence"],
                "supporting_span": span_text
            })

        return results
