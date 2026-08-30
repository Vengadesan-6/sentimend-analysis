import torch
from ml.models.sentiment_model import SentimentTransformerEngine
from ml.models.emotion_model import EmotionTransformerEngine

models = [
    'cardiffnlp/twitter-roberta-base-sentiment-latest',
    'distilbert-base-uncased-finetuned-sst-2-english',
    'nlptown/bert-base-multilingual-uncased-sentiment'
]

test_sentences = [
    "I absolutely love this product. It is amazing.",
    "I hate this product. It is terrible and useless.",
    "The product arrived today. It works as described.",
    "I am extremely disappointed with the service.",
    "This is one of the best experiences I have ever had."
]

for m in models:
    print("=" * 60)
    print("MODEL:", m)
    engine = SentimentTransformerEngine.get_instance(m)
    print("Config id2label:", engine.id2label)
    for text in test_sentences:
        res = engine.predict_single(text)
        print(f"[{res['sentiment']}] (conf: {res['confidence']:.4f}) - {text}")
        print(f"   probabilities: {res['probabilities']}")
