import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from backend.app.config import settings

logger = logging.getLogger("SentixDB")

def is_valid_mongodb_url(url: Optional[str]) -> bool:
    """
    Validates if the provided MongoDB URL is non-empty, stripped,
    and starts with a recognized MongoDB URI scheme.
    """
    if not url or not isinstance(url, str):
        return False
    cleaned = url.strip()
    if not cleaned or cleaned.lower() in ("none", "null", "undefined", '""', "''"):
        return False
    return cleaned.startswith("mongodb://") or cleaned.startswith("mongodb+srv://")

class Database:
    client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None
    _stateless: bool = False

    @property
    def db(self) -> Optional[AsyncIOMotorDatabase]:
        if self._db is not None:
            return self._db

        if self._stateless:
            return None

        raw_url = getattr(settings, "MONGODB_URL", "")
        if not is_valid_mongodb_url(raw_url):
            self._stateless = True
            return None

        try:
            self.client = AsyncIOMotorClient(raw_url.strip(), serverSelectionTimeoutMS=2000)
            self._db = self.client[settings.DATABASE_NAME]
        except Exception as e:
            logger.warning(f"Failed to initialize MongoDB client: {e}. Switching to stateless mode.")
            self.client = None
            self._db = None
            self._stateless = True

        return self._db

    @db.setter
    def db(self, value):
        self._db = value
        if value is None:
            self._stateless = True
        else:
            self._stateless = False

db_instance = Database()

async def connect_to_mongo():
    mongo_url = getattr(settings, "MONGODB_URL", "")
    is_prod = (getattr(settings, "ENVIRONMENT", "") or "").lower() == "production"
    
    if not is_valid_mongodb_url(mongo_url):
        logger.info("No valid MongoDB URL provided. Operating in stateless mode without database persistence.")
        db_instance.client = None
        db_instance._db = None
        db_instance._stateless = True
        return

    cleaned_url = mongo_url.strip()
    if is_prod and "localhost" in cleaned_url:
        logger.info("Localhost MongoDB specified in production. Operating in stateless mode.")
        db_instance.client = None
        db_instance._db = None
        db_instance._stateless = True
        return

    logger.info("Connecting to MongoDB...")
    try:
        db_instance.client = AsyncIOMotorClient(cleaned_url, serverSelectionTimeoutMS=2000)
        db_instance._db = db_instance.client[settings.DATABASE_NAME]
        db_instance._stateless = False
        
        # Ping with short timeout so it never blocks startup
        await db_instance.client.admin.command('ping')
        
        # Create indexes for optimal querying
        await db_instance._db["predictions"].create_index([("created_at", -1)])
        await db_instance._db["predictions"].create_index([("sentiment", 1)])
        await db_instance._db["predictions"].create_index([("emotion", 1)])
        await db_instance._db["datasets"].create_index([("created_at", -1)])
        await db_instance._db["model_metrics"].create_index([("model_name", 1)], unique=True)
        logger.info("MongoDB connected and indexes verified successfully.")
    except Exception as e:
        logger.warning(f"MongoDB connection could not be established ({e}). Operating in stateless mode.")
        db_instance.client = None
        db_instance._db = None
        db_instance._stateless = True

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        try:
            db_instance.client.close()
        except Exception:
            pass
        db_instance.client = None
        db_instance._db = None
        logger.info("MongoDB connection closed.")

def get_database() -> Optional[AsyncIOMotorDatabase]:
    return db_instance.db
