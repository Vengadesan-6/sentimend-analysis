import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "operational"

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data
    assert "status" in json_data["data"]
    assert "device" in json_data["data"]

def test_predict_single_text(client):
    sample_text = "The user interface is exceptionally sleek, fast, and delightful to use!"
    response = client.post("/api/predict", json={"text": sample_text, "include_xai": True})
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    data = json_data["data"]
    assert "sentiment" in data
    assert "confidence" in data
    assert "probabilities" in data
    assert "emotion" in data
    assert "aspects" in data
    assert "explanation" in data
    assert data["sentiment"] in ["Positive", "Negative", "Neutral"]
    assert 0.0 <= data["confidence"] <= 1.0

def test_predict_empty_text_fails(client):
    response = client.post("/api/predict", json={"text": "   "})
    assert response.status_code in [400, 422]

def test_analytics_endpoints(client):
    r_overview = client.get("/api/analytics/overview")
    assert r_overview.status_code == 200
    assert r_overview.json()["success"] is True

    r_sentiment = client.get("/api/analytics/sentiment")
    assert r_sentiment.status_code == 200
    assert r_sentiment.json()["success"] is True

    r_emotions = client.get("/api/analytics/emotions")
    assert r_emotions.status_code == 200
    assert r_emotions.json()["success"] is True

    r_aspects = client.get("/api/analytics/aspects")
    assert r_aspects.status_code == 200
    assert r_aspects.json()["success"] is True

def test_model_performance_endpoint(client):
    response = client.get("/api/model-performance")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "models" in json_data["data"]

def test_predictions_pagination(client):
    response = client.get("/api/predictions?page=1&limit=5")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "items" in json_data["data"]
