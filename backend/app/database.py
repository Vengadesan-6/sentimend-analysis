import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from backend.app.config import settings
from backend.app.storage import (
    save_prediction_record,
    get_prediction_records,
    get_prediction_by_id as get_storage_prediction_by_id,
    delete_prediction_record as delete_storage_prediction_record,
    clear_all_prediction_records as clear_all_storage_prediction_records,
    get_storage_stats
)

logger = logging.getLogger("SentixDB")

def is_valid_mongodb_url(url: Optional[str]) -> bool:
    """
    Validates if the provided MongoDB URL is non-empty, well-formed,
    and has valid host information via PyMongo's URI parser.
    """
    if not url or not isinstance(url, str):
        return False
    cleaned = url.strip()
    if not cleaned or cleaned.lower() in ("none", "null", "undefined", '""', "''"):
        return False
    if not (cleaned.startswith("mongodb://") or cleaned.startswith("mongodb+srv://")):
        return False
    
    try:
        from pymongo.uri_parser import parse_uri
        parsed = parse_uri(cleaned)
        nodes = parsed.get("nodelist") or []
        return len(nodes) > 0
    except Exception:
        return False

class Database:
    client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None
    _stateless: bool = False
    _is_connected: bool = False

    @property
    def is_connected(self) -> bool:
        return self._is_connected and self._db is not None

    @property
    def db(self) -> Optional[AsyncIOMotorDatabase]:
        try:
            if self._db is not None and self._is_connected:
                return self._db

            if self._stateless:
                return None

            raw_url = getattr(settings, "MONGODB_URL", "")
            if not is_valid_mongodb_url(raw_url):
                self._stateless = True
                self._is_connected = False
                return None

            self.client = AsyncIOMotorClient(raw_url.strip(), serverSelectionTimeoutMS=1000)
            self._db = self.client[settings.DATABASE_NAME]
            return self._db
        except Exception as e:
            logger.warning(f"MongoDB connection initialization error: {e}. Operating in persistent fallback mode.")
            self.client = None
            self._db = None
            self._stateless = True
            self._is_connected = False
            return None

    @db.setter
    def db(self, value):
        self._db = value
        if value is None:
            self._stateless = True
            self._is_connected = False
        else:
            self._stateless = False

    async def ping_mongo(self) -> bool:
        """Pings MongoDB to determine if the cluster is actively reachable."""
        try:
            if self.client is None:
                raw_url = getattr(settings, "MONGODB_URL", "")
                if not is_valid_mongodb_url(raw_url):
                    self._is_connected = False
                    return False
                self.client = AsyncIOMotorClient(raw_url.strip(), serverSelectionTimeoutMS=1000)
                self._db = self.client[settings.DATABASE_NAME]
            
            await self.client.admin.command('ping')
            self._is_connected = True
            self._stateless = False
            return True
        except Exception:
            self._is_connected = False
            return False

db_instance = Database()

async def connect_to_mongo():
    db_instance._stateless = False
    db_instance._is_connected = False
    mongo_url = getattr(settings, "MONGODB_URL", "")
    is_prod = (getattr(settings, "ENVIRONMENT", "") or "").lower() == "production"
    
    if not is_valid_mongodb_url(mongo_url):
        logger.info("No valid MongoDB URL provided. Operating with persistent local storage.")
        db_instance.client = None
        db_instance._db = None
        db_instance._stateless = True
        db_instance._is_connected = False
        return

    cleaned_url = mongo_url.strip()
    if is_prod and "localhost" in cleaned_url:
        logger.info("Localhost MongoDB specified in production. Operating with persistent local storage.")
        db_instance.client = None
        db_instance._db = None
        db_instance._stateless = True
        db_instance._is_connected = False
        return

    logger.info("Connecting to MongoDB...")
    try:
        db_instance.client = AsyncIOMotorClient(cleaned_url, serverSelectionTimeoutMS=1500)
        db_instance._db = db_instance.client[settings.DATABASE_NAME]
        
        # Ping with short timeout so it never blocks startup
        await db_instance.client.admin.command('ping')
        
        # Create indexes for optimal querying
        await db_instance._db["predictions"].create_index([("created_at", -1)])
        await db_instance._db["predictions"].create_index([("sentiment", 1)])
        await db_instance._db["predictions"].create_index([("emotion", 1)])
        await db_instance._db["datasets"].create_index([("created_at", -1)])
        await db_instance._db["model_metrics"].create_index([("model_name", 1)], unique=True)
        db_instance._is_connected = True
        db_instance._stateless = False
        logger.info("MongoDB connected and indexes verified successfully.")
    except Exception as e:
        logger.warning(f"MongoDB connection could not be established ({e}). Operating with persistent local storage.")
        db_instance._is_connected = False

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        try:
            db_instance.client.close()
        except Exception:
            pass
        db_instance.client = None
        db_instance._db = None
        db_instance._is_connected = False
        logger.info("MongoDB connection closed.")

def get_database() -> Optional[AsyncIOMotorDatabase]:
    return db_instance.db

async def persist_prediction(doc: Dict[str, Any]) -> str:
    """
    Saves the prediction record into both local persistent storage and MongoDB (if available).
    Guarantees that input text, selected model, sentiment, confidence, and timestamp are never lost.
    """
    # 1. Save to local SQLite persistence immediately
    pred_id = save_prediction_record(doc)
    doc["id"] = pred_id

    # 2. If MongoDB is available, also persist to MongoDB
    if db_instance._is_connected and db_instance.client is not None and db_instance._db is not None:
        try:
            mongo_doc = dict(doc)
            mongo_doc["_id"] = pred_id
            await db_instance._db["predictions"].insert_one(mongo_doc)
        except Exception as e:
            logger.warning(f"Could not write to MongoDB collection: {e}. Local persistence succeeded.")
            db_instance._is_connected = False

    return pred_id

async def fetch_predictions(
    page: int = 1,
    limit: int = 10,
    sentiment: Optional[str] = None,
    emotion: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc"
) -> Tuple[List[Dict[str, Any]], int, bool]:
    """
    Queries prediction history. Returns (items, total, is_mongodb_connected).
    If MongoDB is available, reads from MongoDB.
    If MongoDB is unavailable, gracefully reads from persistent local storage.
    """
    is_mongo = False
    if db_instance._is_connected and db_instance.client is not None and db_instance._db is not None:
        try:
            filter_query: Dict[str, Any] = {}
            if sentiment and sentiment.lower() != "all":
                filter_query["sentiment"] = {"$regex": f"^{sentiment}$", "$options": "i"}
            if emotion and emotion.lower() != "all":
                filter_query["emotion"] = {"$regex": f"^{emotion}$", "$options": "i"}
            if search and search.strip():
                filter_query["text"] = {"$regex": search.strip(), "$options": "i"}

            sort_direction = -1 if order.lower() == "desc" else 1
            skip = max(0, (page - 1) * limit)

            total = await db_instance._db["predictions"].count_documents(filter_query)
            cursor = db_instance._db["predictions"].find(filter_query).sort(sort_by, sort_direction).skip(skip).limit(limit)
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
                    "id": str(d.get("_id") or d.get("id")),
                    "text": d.get("text") or "",
                    "sentiment": (d.get("sentiment") or "Neutral").capitalize(),
                    "confidence": float(d.get("confidence") or 0.0),
                    "probabilities": d.get("probabilities") or {},
                    "emotion": (d.get("emotion") or "Neutral").capitalize(),
                    "aspects": d.get("aspects") or [],
                    "explanation": d.get("explanation"),
                    "model_name": d.get("model_name") or "cardiffnlp/twitter-roberta-base-sentiment-latest",
                    "processing_time_ms": float(d.get("processing_time_ms") or 0.0),
                    "created_at": created_str,
                    "timestamp": d.get("timestamp") or created_str
                })

            db_instance._is_connected = True
            return results, total, True
        except Exception as e:
            logger.warning(f"Error querying MongoDB predictions: {e}. Falling back to persistent storage.")
            db_instance._is_connected = False

    # Fallback to SQLite persistent storage
    items, total = get_prediction_records(
        page=page,
        limit=limit,
        sentiment=sentiment,
        emotion=emotion,
        search=search,
        sort_by=sort_by,
        order=order
    )
    return items, total, False

async def fetch_prediction_by_id(pred_id: str) -> Tuple[Optional[Dict[str, Any]], bool]:
    """Fetches single prediction by ID with MongoDB or local storage fallback."""
    if db_instance._is_connected and db_instance.client is not None and db_instance._db is not None:
        try:
            query = {"_id": pred_id}
            try:
                query = {"$or": [{"_id": ObjectId(pred_id)}, {"_id": pred_id}, {"id": pred_id}]}
            except Exception:
                query = {"$or": [{"_id": pred_id}, {"id": pred_id}]}

            doc = await db_instance._db["predictions"].find_one(query)
            if doc:
                doc["id"] = str(doc.get("_id") or doc.get("id"))
                if "_id" in doc:
                    del doc["_id"]
                if hasattr(doc.get("created_at"), "isoformat"):
                    doc["created_at"] = doc["created_at"].isoformat()
                return doc, True
        except Exception as e:
            logger.warning(f"MongoDB find_one error: {e}")

    item = get_storage_prediction_by_id(pred_id)
    return item, False

async def remove_prediction(pred_id: str) -> Tuple[bool, bool]:
    """Removes single prediction from both MongoDB and local storage."""
    deleted_mongo = False
    if db_instance._is_connected and db_instance.client is not None and db_instance._db is not None:
        try:
            try:
                res = await db_instance._db["predictions"].delete_one({"$or": [{"_id": ObjectId(pred_id)}, {"_id": pred_id}, {"id": pred_id}]})
            except Exception:
                res = await db_instance._db["predictions"].delete_one({"$or": [{"_id": pred_id}, {"id": pred_id}]})
            deleted_mongo = res.deleted_count > 0
        except Exception as e:
            logger.warning(f"MongoDB delete error: {e}")

    deleted_local = delete_storage_prediction_record(pred_id)
    return (deleted_mongo or deleted_local), db_instance._is_connected

async def purge_all_predictions() -> Tuple[int, bool]:
    """Clears all predictions from both MongoDB and local storage."""
    deleted_mongo_count = 0
    if db_instance._is_connected and db_instance.client is not None and db_instance._db is not None:
        try:
            res = await db_instance._db["predictions"].delete_many({})
            deleted_mongo_count = res.deleted_count
        except Exception as e:
            logger.warning(f"MongoDB delete_many error: {e}")

    deleted_local_count = clear_all_storage_prediction_records()
    total_deleted = max(deleted_mongo_count, deleted_local_count)
    return total_deleted, db_instance._is_connected
