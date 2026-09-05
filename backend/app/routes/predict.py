import io
import csv
import time
import logging
from datetime import datetime
from typing import Optional
import pandas as pd
from bson import ObjectId
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.responses import StreamingResponse

from backend.app.schemas import (
    APIResponse,
    SinglePredictionRequest,
    PredictionResponseData,
    BulkAnalysisSummary
)
from backend.app.database import db_instance
from ml.inference import SentimentIntelligencePipeline

router = APIRouter()
logger = logging.getLogger("SentixPredict")

@router.post("/predict", response_model=APIResponse[PredictionResponseData])
@router.post("/predict/", response_model=APIResponse[PredictionResponseData])
@router.post("/sentiment", response_model=APIResponse[PredictionResponseData])
@router.post("/sentiment/", response_model=APIResponse[PredictionResponseData])
async def predict_single_text(payload: SinglePredictionRequest):
    """
    Executes real transformer inference on a single text.
    Persists prediction into MongoDB and returns comprehensive multi-modal sentiment intelligence.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    target_model = payload.model_name or payload.model
    logger.info(f"Incoming prediction request for model [{target_model}] with text: '{payload.text[:60]}...'")

    pipeline = SentimentIntelligencePipeline.get_instance()
    
    # Run real transformer inference
    result = pipeline.analyze_single(
        text=payload.text,
        model_name=target_model,
        include_xai=payload.include_xai
    )

    logger.info(
        f"Inference result: sentiment={result['sentiment']}, confidence={result['confidence']}, "
        f"emotion={result['emotion']}, model={result['model_name']}"
    )

    created_at = datetime.utcnow()

    # Save to MongoDB
    doc = {
        "text": result["text"],
        "cleaned_text": result["cleaned_text"],
        "sentiment": result["sentiment"],
        "confidence": result["confidence"],
        "probabilities": result["probabilities"],
        "emotion": result["emotion"],
        "emotion_probabilities": result.get("emotion_probabilities"),
        "aspects": result.get("aspects", []),
        "explanation": result.get("explanation"),
        "model_name": result["model_name"],
        "processing_time_ms": result["processing_time_ms"],
        "created_at": created_at
    }

    doc_id = None
    if db_instance.db is not None:
        try:
            insert_res = await db_instance.db["predictions"].insert_one(doc)
            doc_id = str(insert_res.inserted_id)
        except Exception as e:
            import logging
            logging.getLogger("SentixPredict").warning(f"Could not persist prediction to MongoDB: {e}")

    response_data = PredictionResponseData(
        id=doc_id,
        text=result["text"],
        sentiment=result["sentiment"],
        confidence=result["confidence"],
        probabilities=result["probabilities"],
        emotion=result["emotion"],
        emotion_probabilities=result.get("emotion_probabilities"),
        aspects=result.get("aspects", []),
        explanation=result.get("explanation"),
        model_name=result["model_name"],
        processing_time_ms=result["processing_time_ms"],
        created_at=created_at.isoformat()
    )

    return APIResponse(
        success=True,
        data=response_data,
        message="Sentiment analysis completed successfully"
    )

@router.post("/bulk-analysis", response_model=APIResponse[BulkAnalysisSummary])
@router.post("/predict/bulk", response_model=APIResponse[BulkAnalysisSummary])
async def bulk_csv_analysis(
    file: UploadFile = File(...),
    model_name: Optional[str] = Form(None)
):
    """
    Handles CSV file upload, validates 'text' column, executes true batched inference,
    persists records and returns aggregate summary statistics.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .csv files are supported.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    # Check for text column (case-insensitive search)
    text_col = None
    for col in df.columns:
        if str(col).strip().lower() in ["text", "review", "sentence", "comment", "feedback", "tweet", "content"]:
            text_col = col
            break

    if not text_col:
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain a 'text' column. Found columns: {list(df.columns)}"
        )

    # Clean and filter empty rows
    valid_df = df.dropna(subset=[text_col]).copy()
    valid_df[text_col] = valid_df[text_col].astype(str)
    valid_df = valid_df[valid_df[text_col].str.strip() != ""]

    if valid_df.empty:
        raise HTTPException(status_code=400, detail="CSV contains no valid non-empty text records.")

    texts = valid_df[text_col].tolist()
    total_records = len(texts)

    start_time = time.perf_counter()
    pipeline = SentimentIntelligencePipeline.get_instance()
    
    # Run batched inference
    batch_results = pipeline.analyze_batch(texts, model_name=model_name)
    total_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    # Compute bulk metrics
    pos_count = sum(1 for r in batch_results if r["sentiment"] == "Positive")
    neg_count = sum(1 for r in batch_results if r["sentiment"] == "Negative")
    neu_count = sum(1 for r in batch_results if r["sentiment"] == "Neutral")
    avg_conf = round(sum(r["confidence"] for r in batch_results) / total_records, 4)

    # Create dataset record
    dataset_doc = {
        "filename": file.filename,
        "total_records": total_records,
        "processed_records": total_records,
        "positive_count": pos_count,
        "negative_count": neg_count,
        "neutral_count": neu_count,
        "avg_confidence": avg_conf,
        "processing_time_ms": total_time_ms,
        "status": "completed",
        "created_at": datetime.utcnow()
    }

    dataset_id = "temp_id"
    if db_instance.db is not None:
        try:
            ds_res = await db_instance.db["datasets"].insert_one(dataset_doc)
            dataset_id = str(ds_res.inserted_id)

            # Bulk insert prediction documents
            prediction_docs = []
            created_at = datetime.utcnow()
            for res in batch_results:
                prediction_docs.append({
                    "dataset_id": dataset_id,
                    "text": res["text"],
                    "cleaned_text": res["cleaned_text"],
                    "sentiment": res["sentiment"],
                    "confidence": res["confidence"],
                    "probabilities": res["probabilities"],
                    "emotion": res["emotion"],
                    "aspects": res.get("aspects", []),
                    "model_name": res["model_name"],
                    "processing_time_ms": res.get("processing_time_ms", 10.0),
                    "created_at": created_at
                })

            if prediction_docs:
                await db_instance.db["predictions"].insert_many(prediction_docs)
        except Exception as e:
            import logging
            logging.getLogger("SentixPredict").warning(f"Could not persist bulk dataset to MongoDB: {e}")

    return APIResponse(
        success=True,
        data=BulkAnalysisSummary(
            dataset_id=dataset_id,
            filename=file.filename or "uploaded.csv",
            total_records=total_records,
            processed_records=total_records,
            positive_count=pos_count,
            negative_count=neg_count,
            neutral_count=neu_count,
            avg_confidence=avg_conf,
            processing_time_ms=total_time_ms,
            sample_results=batch_results[:10]
        ),
        message=f"Successfully analyzed {total_records} records in {total_time_ms}ms"
    )

@router.get("/bulk-analysis/{dataset_id}/download")
@router.get("/predict/bulk/{dataset_id}/download")
async def download_bulk_results(dataset_id: str):
    """
    Streams CSV download of analyzed bulk results with sentiment, emotion, and confidence.
    """
    if db_instance.db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")

    cursor = db_instance.db["predictions"].find({"dataset_id": dataset_id})
    records = await cursor.to_list(length=10000)

    if not records:
        raise HTTPException(status_code=404, detail="Dataset records not found.")

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Text", "Sentiment", "Confidence", "Emotion",
        "Positive_Prob", "Neutral_Prob", "Negative_Prob", "Aspects", "Model", "Analyzed_At"
    ])

    for r in records:
        aspects_str = "; ".join([f"{a['aspect']}:{a['sentiment']}" for a in r.get("aspects", [])])
        probs = r.get("probabilities", {})
        writer.writerow([
            r.get("text", ""),
            r.get("sentiment", ""),
            r.get("confidence", ""),
            r.get("emotion", ""),
            probs.get("Positive", 0),
            probs.get("Neutral", 0),
            probs.get("Negative", 0),
            aspects_str,
            r.get("model_name", ""),
            r.get("created_at", "")
        ])

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = f"attachment; filename=sentiment_results_{dataset_id}.csv"
    return response
