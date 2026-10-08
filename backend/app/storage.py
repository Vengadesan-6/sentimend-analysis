import os
import json
import sqlite3
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

logger = logging.getLogger("SentixStorage")

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "sentiment_history.db")

def _get_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_storage():
    """Initializes the SQLite schema and indexes for reliable local persistence."""
    try:
        os.makedirs(DB_DIR, exist_ok=True)
        with _get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id TEXT PRIMARY KEY,
                    text TEXT NOT NULL,
                    cleaned_text TEXT,
                    sentiment TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    probabilities TEXT,
                    emotion TEXT,
                    emotion_probabilities TEXT,
                    aspects TEXT,
                    explanation TEXT,
                    model_name TEXT NOT NULL,
                    processing_time_ms REAL,
                    created_at TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_pred_created_at ON predictions (created_at DESC)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_pred_sentiment ON predictions (sentiment)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_pred_emotion ON predictions (emotion)")
            conn.commit()
        logger.info(f"Local persistence database initialized at {DB_PATH}")
    except Exception as e:
        logger.error(f"Failed to initialize local persistence database: {e}", exc_info=True)

# Run initialization on import
init_storage()

def save_prediction_record(doc: Dict[str, Any]) -> str:
    """
    Saves a prediction record into the persistent local store.
    Guarantees that input text, selected model, sentiment, confidence, and timestamp are saved.
    """
    import uuid
    pred_id = str(doc.get("id") or f"pred_{uuid.uuid4().hex[:12]}")
    text = doc.get("text", "")
    cleaned_text = doc.get("cleaned_text", text)
    sentiment = str(doc.get("sentiment", "Neutral")).capitalize()
    confidence = float(doc.get("confidence", 0.0))
    model_name = str(doc.get("model_name") or doc.get("selected_model") or "cardiffnlp/twitter-roberta-base-sentiment-latest")
    processing_time_ms = float(doc.get("processing_time_ms", 0.0))
    
    created_at = doc.get("created_at")
    if isinstance(created_at, datetime):
        created_str = created_at.isoformat()
    elif isinstance(created_at, str) and created_at:
        created_str = created_at
    else:
        created_str = datetime.utcnow().isoformat()
        
    timestamp = doc.get("timestamp") or created_str
    
    probs = json.dumps(doc.get("probabilities") or {})
    emo = str(doc.get("emotion", "Neutral")).capitalize()
    emo_probs = json.dumps(doc.get("emotion_probabilities") or {})
    aspects = json.dumps(doc.get("aspects") or [])
    explanation = json.dumps(doc.get("explanation")) if doc.get("explanation") is not None else None

    try:
        with _get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO predictions (
                    id, text, cleaned_text, sentiment, confidence, probabilities,
                    emotion, emotion_probabilities, aspects, explanation,
                    model_name, processing_time_ms, created_at, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pred_id, text, cleaned_text, sentiment, confidence, probs,
                emo, emo_probs, aspects, explanation,
                model_name, processing_time_ms, created_str, timestamp
            ))
            conn.commit()
        return pred_id
    except Exception as e:
        logger.error(f"Error persisting prediction to local database: {e}", exc_info=True)
        return pred_id

def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    def safe_json_loads(val: Optional[str], default: Any = None) -> Any:
        if not val:
            return default
        try:
            return json.loads(val)
        except Exception:
            return default

    return {
        "id": row["id"],
        "text": row["text"],
        "cleaned_text": row["cleaned_text"],
        "sentiment": row["sentiment"],
        "confidence": float(row["confidence"]),
        "probabilities": safe_json_loads(row["probabilities"], {}),
        "emotion": row["emotion"],
        "emotion_probabilities": safe_json_loads(row["emotion_probabilities"], {}),
        "aspects": safe_json_loads(row["aspects"], []),
        "explanation": safe_json_loads(row["explanation"], None),
        "model_name": row["model_name"],
        "processing_time_ms": float(row["processing_time_ms"] or 0.0),
        "created_at": row["created_at"],
        "timestamp": row["timestamp"],
    }

def get_prediction_records(
    page: int = 1,
    limit: int = 10,
    sentiment: Optional[str] = None,
    emotion: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc"
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Fetches paginated, filtered, searched, and sorted prediction records from local persistence.
    """
    allowed_sort_cols = {"created_at", "confidence", "sentiment", "processing_time_ms", "text"}
    col = sort_by if sort_by in allowed_sort_cols else "created_at"
    sort_dir = "DESC" if order.lower() == "desc" else "ASC"

    where_clauses = []
    params: List[Any] = []

    if sentiment and sentiment.lower() != "all":
        where_clauses.append("LOWER(sentiment) = LOWER(?)")
        params.append(sentiment.strip())

    if emotion and emotion.lower() != "all":
        where_clauses.append("LOWER(emotion) = LOWER(?)")
        params.append(emotion.strip())

    if search and search.strip():
        where_clauses.append("text LIKE ?")
        params.append(f"%{search.strip()}%")

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    try:
        with _get_connection() as conn:
            count_cursor = conn.execute(f"SELECT COUNT(*) as total FROM predictions {where_sql}", params)
            total = count_cursor.fetchone()["total"]

            skip = max(0, (page - 1) * limit)
            query_sql = f"SELECT * FROM predictions {where_sql} ORDER BY {col} {sort_dir} LIMIT ? OFFSET ?"
            query_params = params + [limit, skip]

            cursor = conn.execute(query_sql, query_params)
            rows = cursor.fetchall()

            items = [_row_to_dict(r) for r in rows]
            return items, total
    except Exception as e:
        logger.error(f"Error querying local predictions database: {e}", exc_info=True)
        return [], 0

def get_prediction_by_id(pred_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a single prediction by its unique identifier."""
    try:
        with _get_connection() as conn:
            cursor = conn.execute("SELECT * FROM predictions WHERE id = ?", (pred_id,))
            row = cursor.fetchone()
            if row:
                return _row_to_dict(row)
            return None
    except Exception as e:
        logger.error(f"Error querying prediction by ID: {e}", exc_info=True)
        return None

def delete_prediction_record(pred_id: str) -> bool:
    """Deletes a single prediction from local storage."""
    try:
        with _get_connection() as conn:
            cursor = conn.execute("DELETE FROM predictions WHERE id = ?", (pred_id,))
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error deleting prediction {pred_id}: {e}", exc_info=True)
        return False

def clear_all_prediction_records() -> int:
    """Clears all prediction records from local storage."""
    try:
        with _get_connection() as conn:
            cursor = conn.execute("DELETE FROM predictions")
            conn.commit()
            return cursor.rowcount
    except Exception as e:
        logger.error(f"Error clearing local prediction records: {e}", exc_info=True)
        return 0

def get_storage_stats() -> Dict[str, Any]:
    """Computes aggregate analytics statistics directly from local storage."""
    try:
        with _get_connection() as conn:
            total_cur = conn.execute("SELECT COUNT(*) as total, AVG(confidence) as avg_conf FROM predictions")
            row = total_cur.fetchone()
            total = row["total"] or 0
            avg_conf = round(float(row["avg_conf"] or 0.0), 4)

            pos_cur = conn.execute("SELECT COUNT(*) as cnt FROM predictions WHERE LOWER(sentiment) = 'positive'")
            pos_cnt = pos_cur.fetchone()["cnt"] or 0

            neg_cur = conn.execute("SELECT COUNT(*) as cnt FROM predictions WHERE LOWER(sentiment) = 'negative'")
            neg_cnt = neg_cur.fetchone()["cnt"] or 0

            neu_cur = conn.execute("SELECT COUNT(*) as cnt FROM predictions WHERE LOWER(sentiment) = 'neutral'")
            neu_cnt = neu_cur.fetchone()["cnt"] or 0

            return {
                "total_analyses": total,
                "positive_count": pos_cnt,
                "negative_count": neg_cnt,
                "neutral_count": neu_cnt,
                "avg_confidence": avg_conf,
                "positive_percentage": round((pos_cnt / total) * 100, 1) if total > 0 else 0,
                "negative_percentage": round((neg_cnt / total) * 100, 1) if total > 0 else 0,
                "neutral_percentage": round((neu_cnt / total) * 100, 1) if total > 0 else 0,
            }
    except Exception as e:
        logger.error(f"Error calculating storage stats: {e}", exc_info=True)
        return {
            "total_analyses": 0,
            "positive_count": 0,
            "negative_count": 0,
            "neutral_count": 0,
            "avg_confidence": 0.0,
            "positive_percentage": 0,
            "negative_percentage": 0,
            "neutral_percentage": 0,
        }
