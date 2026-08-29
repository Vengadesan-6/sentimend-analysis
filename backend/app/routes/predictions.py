from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from bson import ObjectId
from backend.app.schemas import APIResponse, PredictionResponseData
from backend.app.database import db_instance

router = APIRouter()

@router.get("/predictions", response_model=APIResponse[dict])
async def get_predictions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    sentiment: Optional[str] = Query(default=None),
    emotion: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    sort_by: str = Query(default="created_at"),
    order: str = Query(default="desc")
):
    """
    Paginated, filterable, searchable, and sortable prediction history from MongoDB.
    """
    if db_instance.db is None:
        return APIResponse(
            success=True,
            data={
                "items": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "total_pages": 1
            },
            message="Database not initialized"
        )

    try:
        filter_query = {}
        if sentiment and sentiment.lower() != "all":
            filter_query["sentiment"] = {"$regex": f"^{sentiment}$", "$options": "i"}
        if emotion and emotion.lower() != "all":
            filter_query["emotion"] = {"$regex": f"^{emotion}$", "$options": "i"}
        if search:
            filter_query["text"] = {"$regex": search, "$options": "i"}

        sort_direction = -1 if order.lower() == "desc" else 1
        skip = (page - 1) * limit

        total = await db_instance.db["predictions"].count_documents(filter_query)
        cursor = db_instance.db["predictions"].find(filter_query).sort(sort_by, sort_direction).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)

        results = []
        for d in docs:
            created_val = d.get("created_at")
            if hasattr(created_val, "isoformat"):
                created_str = created_val.isoformat()
            elif created_val:
                created_str = str(created_val)
            else:
                created_str = ""

            results.append({
                "id": str(d["_id"]),
                "text": d.get("text") or "",
                "sentiment": (d.get("sentiment") or "Neutral").capitalize(),
                "confidence": float(d.get("confidence") or 0.0),
                "probabilities": d.get("probabilities") or {},
                "emotion": (d.get("emotion") or "Neutral").capitalize(),
                "aspects": d.get("aspects") or [],
                "explanation": d.get("explanation"),
                "model_name": d.get("model_name") or "cardiffnlp/twitter-roberta-base-sentiment-latest",
                "processing_time_ms": float(d.get("processing_time_ms") or 0.0),
                "created_at": created_str
            })

        return APIResponse(
            success=True,
            data={
                "items": results,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit if total > 0 else 1
            },
            message="Fetched predictions successfully"
        )
    except Exception as e:
        return APIResponse(
            success=True,
            data={
                "items": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "total_pages": 1
            },
            message=f"Database query error: {str(e)}"
        )

@router.get("/predictions/{pred_id}", response_model=APIResponse[dict])
async def get_prediction_by_id(pred_id: str):
    """
    Fetch single prediction details.
    """
    if db_instance.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    try:
        obj_id = ObjectId(pred_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid prediction ID format")

    doc = await db_instance.db["predictions"].find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Prediction record not found")

    doc["id"] = str(doc["_id"])
    del doc["_id"]
    if hasattr(doc.get("created_at"), "isoformat"):
        doc["created_at"] = doc["created_at"].isoformat()

    return APIResponse(
        success=True,
        data=doc,
        message="Fetched prediction detail"
    )

@router.delete("/predictions/{pred_id}", response_model=APIResponse[dict])
async def delete_prediction(pred_id: str):
    """
    Delete a prediction record by ID.
    """
    if db_instance.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    try:
        obj_id = ObjectId(pred_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid prediction ID format")

    res = await db_instance.db["predictions"].delete_one({"_id": obj_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prediction record not found")

    return APIResponse(
        success=True,
        data={"deleted_id": pred_id},
        message="Prediction deleted successfully"
    )
