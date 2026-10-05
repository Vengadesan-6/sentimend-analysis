import sys
import asyncio
from fastapi import APIRouter
from backend.app.schemas import APIResponse
from backend.app.database import db_instance

router = APIRouter()

@router.get("/health", response_model=APIResponse[dict])
async def health_check():
    """
    Returns live health status of API and platform components without blocking or loading heavy models.
    Guaranteed to return in milliseconds to prevent Render healthcheck timeouts.
    """
    # Check MongoDB with strict 1.0s timeout to never hang
    mongo_status = False
    try:
        if db_instance.client is not None:
            await asyncio.wait_for(db_instance.client.admin.command('ping'), timeout=1.0)
            mongo_status = True
    except Exception:
        mongo_status = False

    # Check ML Models status safely WITHOUT triggering heavy PyTorch/Transformers imports
    ml_status = False
    if "ml.models.sentiment_model" in sys.modules:
        try:
            SentimentTransformerEngine = sys.modules["ml.models.sentiment_model"].SentimentTransformerEngine
            ml_status = bool(getattr(SentimentTransformerEngine, "_instances", {}))
        except Exception:
            ml_status = False

    device_name = "cpu"
    cuda_avail = False
    if "torch" in sys.modules:
        try:
            torch_mod = sys.modules["torch"]
            cuda_avail = torch_mod.cuda.is_available()
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

