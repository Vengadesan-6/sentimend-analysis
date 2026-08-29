from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class PredictionDocument(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    text: str
    cleaned_text: Optional[str] = None
    sentiment: str
    confidence: float
    probabilities: Dict[str, float]
    emotion: str
    emotion_probabilities: Optional[Dict[str, float]] = None
    aspects: List[Dict[str, Any]] = []
    explanation: Optional[Dict[str, Any]] = None
    model_name: str
    processing_time_ms: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class DatasetDocument(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    filename: str
    total_records: int
    processed_records: int
    positive_count: int = 0
    negative_count: int = 0
    neutral_count: int = 0
    avg_confidence: float = 0.0
    status: str = "completed"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class ModelMetricsDocument(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    model_name: str
    display_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    macro_f1: Optional[float] = None
    inference_time_ms: float
    test_sample_count: int
    confusion_matrix: Optional[Dict[str, Any]] = None
    evaluated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
