from fastapi import APIRouter
from backend.app.schemas import APIResponse
from backend.app.database import db_instance

router = APIRouter()

@router.get("/health", response_model=APIResponse[dict])
async def health_check():
    """
    Returns live health status of API and platform components without blocking or loading heavy models.
    """
    # Check MongoDB
    mongo_status = False
    try:
        if db_instance.client:
            await db_instance.client.admin.command('ping')
            mongo_status = True
    except Exception:
        mongo_status = False

    # Check ML Models status safely without instantiating or triggering heavy downloads
    ml_status = False
    try:
        from ml.models.sentiment_model import SentimentTransformerEngine
        ml_status = bool(getattr(SentimentTransformerEngine, "_instances", {}))
    except Exception:
        ml_status = False

    device_name = "cpu"
    cuda_avail = False
    try:
        import torch
        cuda_avail = torch.cuda.is_available()
        device_name = "cuda" if cuda_avail else "cpu"
    except Exception:
        pass

    return APIResponse(
        success=True,
        data={
            "status": "healthy" if mongo_status else "operational",
            "api": True,
            "database": mongo_status,
            "models_loaded": ml_status,
            "device": device_name,
            "cuda_available": cuda_avail
        },
        message="Sentix AI Platform operational"
    )
