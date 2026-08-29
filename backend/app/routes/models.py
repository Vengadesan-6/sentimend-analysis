from fastapi import APIRouter, HTTPException
from backend.app.schemas import APIResponse
from backend.app.database import db_instance

router = APIRouter()

@router.get("/model-performance", response_model=APIResponse[dict])
async def get_model_performance():
    """
    Returns real model comparison metrics (Accuracy, Precision, Recall, F1, Latency, Confusion Matrix)
    derived from evaluated benchmark test runs stored in MongoDB `model_metrics`.
    """
    if db_instance.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    cursor = db_instance.db["model_metrics"].find({}).sort("f1_score", -1)
    metrics_list = await cursor.to_list(length=10)

    models = []
    for m in metrics_list:
        models.append({
            "model_name": m.get("model_name", ""),
            "display_name": m.get("display_name", m.get("model_name", "").split("/")[-1]),
            "accuracy": m.get("accuracy", 0.0),
            "precision": m.get("precision", 0.0),
            "recall": m.get("recall", 0.0),
            "f1_score": m.get("f1_score", 0.0),
            "macro_f1": m.get("macro_f1", 0.0),
            "inference_time_ms": m.get("inference_time_ms", 0.0),
            "test_sample_count": m.get("test_sample_count", 0),
            "confusion_matrix": m.get("confusion_matrix"),
            "evaluated_at": m.get("evaluated_at", "")
        })

    return APIResponse(
        success=True,
        data={
            "models": models,
            "total_models": len(models),
            "best_f1_model": models[0]["display_name"] if models else None,
            "fastest_model": min(models, key=lambda x: x["inference_time_ms"])["display_name"] if models else None
        },
        message="Model metrics retrieved"
    )
