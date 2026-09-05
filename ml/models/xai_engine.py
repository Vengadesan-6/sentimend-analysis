import torch
import numpy as np
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class ExplainableAIEngine:
    """
    Explainable AI (XAI) Engine for Transformer Sentiment Models.
    Computes token-level attribution and saliency scores via embedding gradients
    and attention weights, indicating which words pushed the sentiment prediction.
    """
    _instance = None

    @classmethod
    def get_instance(cls) -> "ExplainableAIEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def explain(self, text: str, sentiment_engine) -> Dict:
        """
        Computes token-level importance scores and directional impact using transformer gradient saliency.
        """
        if not text or not text.strip():
            return {
                "method": "Model-based Gradient Saliency",
                "tokens": [],
                "scores": [],
                "top_positive_words": [],
                "top_negative_words": []
            }

        tokenizer = sentiment_engine.tokenizer
        model = sentiment_engine.model
        device = sentiment_engine.device

        # Tokenize input
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=128
        )
        input_ids = inputs["input_ids"].to(device)
        attention_mask = inputs["attention_mask"].to(device)

        # Get embeddings layer
        embeddings = model.get_input_embeddings()
        inputs_embeds = embeddings(input_ids).clone().detach().requires_grad_(True)

        # Forward pass
        outputs = model(inputs_embeds=inputs_embeds, attention_mask=attention_mask)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1)
        pred_class = torch.argmax(probs, dim=-1).item()

        # Backward pass on predicted class logit
        model.zero_grad(set_to_none=True)
        target_logit = logits[0, pred_class]
        target_logit.backward()

        # Saliency = Norm of gradients across embedding dimension
        grads = inputs_embeds.grad[0] # (seq_len, hidden_dim)
        attribution = torch.sum(grads * inputs_embeds[0], dim=-1).detach().cpu().numpy()
        
        # Immediately release gradient tensors to minimize RAM
        inputs_embeds.grad = None
        model.zero_grad(set_to_none=True)

        # Decode tokens
        raw_tokens = tokenizer.convert_ids_to_tokens(input_ids[0].cpu().numpy())
        
        # Clean tokens and align scores
        cleaned_tokens = []
        scores = []
        
        for tok, score in zip(raw_tokens, attribution):
            # Skip special tokens <s>, </s>, [CLS], [SEP], <pad>
            if tok in ["<s>", "</s>", "[CLS]", "[SEP]", "<pad>", " "]:
                continue
            
            clean_tok = tok.replace("Ġ", "").replace("##", "")
            if not clean_tok.strip():
                continue
                
            cleaned_tokens.append(clean_tok)
            scores.append(float(score))

        # Normalize scores to range [-1.0, 1.0]
        if scores:
            max_abs = max(abs(min(scores)), abs(max(scores)), 1e-6)
            norm_scores = [round(s / max_abs, 4) for s in scores]
        else:
            norm_scores = []

        # Identify top positive & negative contributing words
        token_score_pairs = list(zip(cleaned_tokens, norm_scores))
        
        pos_words = [t for t, s in sorted(token_score_pairs, key=lambda x: x[1], reverse=True) if s > 0.2][:5]
        neg_words = [t for t, s in sorted(token_score_pairs, key=lambda x: x[1]) if s < -0.2][:5]

        return {
            "method": "Model-based Gradient Saliency & Attention Attribution",
            "predicted_class": pred_class,
            "tokens": cleaned_tokens,
            "scores": norm_scores,
            "top_positive_words": pos_words,
            "top_negative_words": neg_words
        }
