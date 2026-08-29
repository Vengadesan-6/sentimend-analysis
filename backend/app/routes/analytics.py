from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from backend.app.schemas import APIResponse
from backend.app.database import db_instance

router = APIRouter()

@router.get("/analytics/overview", response_model=APIResponse[dict])
async def get_analytics_overview():
    """
    Computes overall KPI statistics directly from MongoDB.
    """
    if db_instance.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    total = await db_instance.db["predictions"].count_documents({})
    pos_count = await db_instance.db["predictions"].count_documents({"sentiment": "Positive"})
    neg_count = await db_instance.db["predictions"].count_documents({"sentiment": "Negative"})
    neu_count = await db_instance.db["predictions"].count_documents({"sentiment": "Neutral"})

    pipeline = [
        {"$group": {"_id": None, "avg_conf": {"$avg": "$confidence"}}}
    ]
    avg_res = await db_instance.db["predictions"].aggregate(pipeline).to_list(1)
    avg_conf = round(avg_res[0]["avg_conf"], 4) if avg_res and avg_res[0].get("avg_conf") else 0.0

    return APIResponse(
        success=True,
        data={
            "total_analyses": total,
            "positive_count": pos_count,
            "negative_count": neg_count,
            "neutral_count": neu_count,
            "avg_confidence": avg_conf,
            "positive_percentage": round((pos_count / total) * 100, 1) if total > 0 else 0,
            "negative_percentage": round((neg_count / total) * 100, 1) if total > 0 else 0,
            "neutral_percentage": round((neu_count / total) * 100, 1) if total > 0 else 0,
        },
        message="Analytics overview computed"
    )

@router.get("/analytics/sentiment", response_model=APIResponse[dict])
async def get_sentiment_analytics():
    """
    Returns sentiment breakdown and historical timeline distribution from MongoDB.
    """
    if db_instance.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    # Group by sentiment
    dist_pipeline = [
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}
    ]
    dist_res = await db_instance.db["predictions"].aggregate(dist_pipeline).to_list(10)
    distribution = {item["_id"] or "Unknown": item["count"] for item in dist_res}

    # Group by date for trend
    trend_pipeline = [
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": {"$toDate": "$created_at"},
                        "onError": "2026-08-29",
                        "onNull": "2026-08-29"
                    }
                },
                "positive": {"$sum": {"$cond": [{"$eq": ["$sentiment", "Positive"]}, 1, 0]}},
                "neutral": {"$sum": {"$cond": [{"$eq": ["$sentiment", "Neutral"]}, 1, 0]}},
                "negative": {"$sum": {"$cond": [{"$eq": ["$sentiment", "Negative"]}, 1, 0]}},
                "total": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}},
        {"$limit": 14}
    ]
    try:
        trend_res = await db_instance.db["predictions"].aggregate(trend_pipeline).to_list(30)
    except Exception:
        trend_res = []
    
    # Format trend timeline
    trend = []
    for item in trend_res:
        trend.append({
            "date": item["_id"] or datetime.utcnow().strftime("%Y-%m-%d"),
            "positive": item.get("positive", 0),
            "neutral": item.get("neutral", 0),
            "negative": item.get("negative", 0),
            "total": item.get("total", 0)
        })

    # Confidence histogram intervals
    conf_pipeline = [
        {
            "$bucket": {
                "groupBy": "$confidence",
                "boundaries": [0.0, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01],
                "default": "Other",
                "output": {"count": {"$sum": 1}}
            }
        }
    ]
    try:
        conf_res = await db_instance.db["predictions"].aggregate(conf_pipeline).to_list(10)
        bucket_labels = {
            0.0: "0-50%",
            0.5: "50-60%",
            0.6: "60-70%",
            0.7: "70-80%",
            0.8: "80-90%",
            0.9: "90-100%"
        }
        confidence_distribution = [
            {"range": bucket_labels.get(b["_id"], str(b["_id"])), "count": b["count"]}
            for b in conf_res if b["_id"] != "Other"
        ]
    except Exception:
        confidence_distribution = []

    return APIResponse(
        success=True,
        data={
            "distribution": distribution,
            "trend": trend,
            "confidence_distribution": confidence_distribution
        },
        message="Sentiment analytics fetched"
    )

@router.get("/analytics/emotions", response_model=APIResponse[dict])
async def get_emotion_analytics():
    """
    Returns aggregated emotion classification statistics from MongoDB.
    """
    if db_instance.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    pipeline = [
        {"$group": {"_id": "$emotion", "count": {"$sum": 1}, "avg_confidence": {"$avg": "$confidence"}}},
        {"$sort": {"count": -1}}
    ]
    emotions_res = await db_instance.db["predictions"].aggregate(pipeline).to_list(20)

    emotions = []
    for item in emotions_res:
        emotions.append({
            "emotion": item["_id"] or "Neutral",
            "count": item["count"],
            "avg_confidence": round(item.get("avg_confidence", 0.0), 4)
        })

    return APIResponse(
        success=True,
        data={"emotions": emotions},
        message="Emotion analytics fetched"
    )

@router.get("/analytics/aspects", response_model=APIResponse[dict])
async def get_aspect_analytics():
    """
    Returns aggregated aspect-based sentiment data from MongoDB.
    """
    if db_instance.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    pipeline = [
        {"$unwind": "$aspects"},
        {
            "$group": {
                "_id": "$aspects.aspect",
                "count": {"$sum": 1},
                "positive": {"$sum": {"$cond": [{"$eq": ["$aspects.sentiment", "Positive"]}, 1, 0]}},
                "negative": {"$sum": {"$cond": [{"$eq": ["$aspects.sentiment", "Negative"]}, 1, 0]}},
                "neutral": {"$sum": {"$cond": [{"$eq": ["$aspects.sentiment", "Neutral"]}, 1, 0]}},
                "avg_confidence": {"$avg": "$aspects.confidence"}
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]
    aspects_res = await db_instance.db["predictions"].aggregate(pipeline).to_list(15)

    aspects = []
    for item in aspects_res:
        aspects.append({
            "aspect": item["_id"],
            "count": item["count"],
            "positive": item.get("positive", 0),
            "negative": item.get("negative", 0),
            "neutral": item.get("neutral", 0),
            "avg_confidence": round(item.get("avg_confidence", 0.0), 4)
        })

    return APIResponse(
        success=True,
        data={"aspects": aspects},
        message="Aspect analytics fetched"
    )
