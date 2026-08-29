from fastapi import APIRouter
import torch
from backend.app.schemas import APIResponse
from backend.app.database import db_instance
from ml.models.sentiment_model import SentimentTransformerEngine
from ml.models.emotion_model import EmotionTransformerEngine

router = APIRouter()

@router.get("/health", response_model=APIResponse[dict])
async def health_check():
    """
    Returns live health status of API, MongoDB, and Transformer ML Engine.
    """
    # Check MongoDB
    mongo_status = False
    try:
        if db_instance.client:
            await db_instance.client.admin.command('ping')
            mongo_status = True
    except Exception:
        mongo_status = False

    # Check ML Models
    ml_status = False
    try:
        sent_engine = SentimentTransformerEngine.get_instance()
        ml_status = sent_engine is not None
    except Exception:
        ml_status = False

    device_name = "cuda" if torch.cuda.is_available() else "cpu"

    return APIResponse(
        success=True,
        data={
            "status": "healthy" if (mongo_status and ml_status) else "degraded",
            "api": True,
            "database": mongo_status,
            "models_loaded": ml_status,
            "device": device_name,
            "cuda_available": torch.cuda.is_available()
        },
        message="Sentix AI Platform operational"
    )
