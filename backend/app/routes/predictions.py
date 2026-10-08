import logging
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from backend.app.schemas import APIResponse
from backend.app.database import (
    fetch_predictions,
    fetch_prediction_by_id,
    remove_prediction,
    purge_all_predictions
)

router = APIRouter()
logger = logging.getLogger("SentixPredictionsRoute")

@router.get("/predictions", response_model=APIResponse[dict])
@router.get("/history", response_model=APIResponse[dict])
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
    Paginated, filterable, searchable, and sortable prediction history.
    Fetches directly from MongoDB if connected, or from persistent local storage if MongoDB is unavailable.
    """
    try:
        items, total, is_mongo = await fetch_predictions(
            page=page,
            limit=limit,
            sentiment=sentiment,
            emotion=emotion,
            search=search,
            sort_by=sort_by,
            order=order
        )

        total_pages = (total + limit - 1) // limit if total > 0 else 1

        message = (
            "Fetched predictions from MongoDB cluster successfully"
            if is_mongo
            else "MongoDB is currently unavailable. Displaying persistent local audit trail."
        )

        return APIResponse(
            success=True,
            data={
                "items": items,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "mongodb_connected": is_mongo,
                "database_status": "connected" if is_mongo else "offline"
            },
            message=message
        )
    except Exception as e:
        logger.error(f"Error serving prediction history: {e}", exc_info=True)
        return APIResponse(
            success=False,
            data={
                "items": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "total_pages": 1,
                "mongodb_connected": False,
                "database_status": "offline"
            },
            message=f"Failed to query prediction history: {str(e)}"
        )

@router.get("/predictions/{pred_id}", response_model=APIResponse[dict])
@router.get("/history/{pred_id}", response_model=APIResponse[dict])
async def get_prediction_by_id(pred_id: str):
    """
    Fetch single prediction details from MongoDB or local persistence.
    """
    doc, is_mongo = await fetch_prediction_by_id(pred_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Prediction record not found.")

    return APIResponse(
        success=True,
        data=doc,
        message="Fetched prediction detail" if is_mongo else "Fetched prediction detail from persistent local storage"
    )

@router.delete("/predictions/{pred_id}", response_model=APIResponse[dict])
@router.delete("/history/{pred_id}", response_model=APIResponse[dict])
async def delete_prediction(pred_id: str):
    """
    Delete a single prediction record by ID from both MongoDB and local storage.
    """
    deleted, is_mongo = await remove_prediction(pred_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Prediction record not found or already deleted.")

    return APIResponse(
        success=True,
        data={"deleted_id": pred_id},
        message="Prediction deleted successfully"
    )

@router.delete("/predictions", response_model=APIResponse[dict])
@router.delete("/history", response_model=APIResponse[dict])
async def clear_all_predictions():
    """
    Clear all prediction records from both MongoDB and local persistence.
    """
    count, is_mongo = await purge_all_predictions()
    return APIResponse(
        success=True,
        data={"deleted_count": count},
        message=f"Cleared {count} prediction records successfully"
    )
