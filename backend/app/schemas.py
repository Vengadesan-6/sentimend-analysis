from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Generic, TypeVar
from datetime import datetime

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None

class SinglePredictionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Input text up to 5000 chars")
    model_name: Optional[str] = Field(default=None, description="Optional target transformer model")
    model: Optional[str] = Field(default=None, description="Alias for model_name")
    include_xai: bool = Field(default=True, description="Whether to include token-level explainability")

class AspectResult(BaseModel):
    aspect: str
    sentiment: str
    confidence: float
    supporting_span: str

class ExplanationResult(BaseModel):
    method: str
    predicted_class: Optional[int] = None
    tokens: List[str]
    scores: List[float]
    top_positive_words: List[str] = []
    top_negative_words: List[str] = []

class PredictionResponseData(BaseModel):
    id: Optional[str] = None
    text: str
    sentiment: str
    confidence: float
    probabilities: Dict[str, float]
    emotion: str
    emotion_probabilities: Optional[Dict[str, float]] = None
    aspects: List[AspectResult] = []
    explanation: Optional[ExplanationResult] = None
    model_name: str
    processing_time_ms: float
    created_at: Optional[str] = None

class BulkAnalysisSummary(BaseModel):
    dataset_id: str
    filename: str
    total_records: int
    processed_records: int
    positive_count: int
    negative_count: int
    neutral_count: int
    avg_confidence: float
    processing_time_ms: float
    sample_results: List[Dict[str, Any]] = []

class AnalyticsOverview(BaseModel):
    total_analyses: int
    positive_count: int
    negative_count: int
    neutral_count: int
    avg_confidence: float
    positive_percentage: float
    negative_percentage: float
    neutral_percentage: float

class ModelMetricItem(BaseModel):
    model_name: str
    display_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    inference_time_ms: float
    test_sample_count: int
    confusion_matrix: Optional[Dict[str, Any]] = None
    evaluated_at: str
