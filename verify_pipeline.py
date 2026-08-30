import requests
import json
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_full_pipeline():
    print(">>> 1. Testing Health Endpoint...")
    res = client.get("/api/health")
    print("Health response:", res.json())
    assert res.status_code == 200
    assert res.json()["success"] is True

    test_inputs = [
        ("I absolutely love this product. It is amazing.", "Positive"),
        ("I hate this product. It is terrible and useless.", "Negative"),
        ("The product arrived today. It works as described.", "Positive"),
        ("I am extremely disappointed with the service.", "Negative"),
        ("This is one of the best experiences I have ever had.", "Positive")
    ]

    models = [
        "cardiffnlp/twitter-roberta-base-sentiment-latest",
        "distilbert-base-uncased-finetuned-sst-2-english",
        "nlptown/bert-base-multilingual-uncased-sentiment"
    ]

    for model in models:
        print(f"\n{'='*60}\n>>> Testing Model: {model}\n{'='*60}")
        for text, expected_sentiment in test_inputs:
            payload = {
                "text": text,
                "model_name": model,
                "include_xai": True
            }
            res = client.post("/api/predict", json=payload)
            assert res.status_code == 200, f"Error {res.status_code}: {res.text}"
            data = res.json()["data"]
            
            print(f"Input: \"{text}\"")
            print(f"  -> Sentiment: {data['sentiment']}")
            print(f"  -> Confidence: {data['confidence']}")
            print(f"  -> Probabilities: {data['probabilities']}")
            print(f"  -> Emotion: {data['emotion']}")
            print(f"  -> Model Used: {data['model_name']}")
            print(f"  -> Processing Time: {data['processing_time_ms']}ms")
            
            assert data["text"] == text
            assert data["confidence"] > 0.5
            assert data["probabilities"]["Positive"] + data["probabilities"]["Neutral"] + data["probabilities"]["Negative"] > 0.99

    print("\n>>> 2. Testing /api/sentiment alias...")
    alias_res = client.post("/api/sentiment", json={"text": "Outstanding and wonderful experience!", "model": "roberta"})
    assert alias_res.status_code == 200
    assert alias_res.json()["data"]["sentiment"] == "Positive"
    print("Alias /api/sentiment test passed!")

    print("\n>>> 3. Testing /api/history & /api/predictions...")
    hist_res = client.get("/api/history")
    assert hist_res.status_code == 200
    print(f"History items count: {len(hist_res.json()['data']['items'])}")
    print("History endpoint test passed!")

    print("\n>>> ALL PIPELINE VERIFICATIONS PASSED!")

if __name__ == "__main__":
    test_full_pipeline()
