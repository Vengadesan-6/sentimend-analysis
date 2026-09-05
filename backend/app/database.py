import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from backend.app.config import settings

logger = logging.getLogger("SentixDB")

class Database:
    client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=4000)
            self._db = self.client[settings.DATABASE_NAME]
        return self._db

    @db.setter
    def db(self, value):
        self._db = value

db_instance = Database()

async def connect_to_mongo():
    mongo_url = (settings.MONGODB_URL or "").strip()
    is_prod = (settings.ENVIRONMENT or "").lower() == "production"
    
    # In production without a remote Mongo URL, or if empty / localhost in production
    if not mongo_url or (is_prod and "localhost" in mongo_url):
        logger.warning("No remote MongoDB URL provided. Operating in stateless mode without database persistence.")
        db_instance.client = None
        db_instance.db = None
        return

    logger.info(f"Connecting to MongoDB at {mongo_url}...")
    try:
        db_instance.client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        
        # Ping with short timeout so it never blocks startup
        await db_instance.client.admin.command('ping')
        
        # Create indexes for optimal querying
        await db_instance.db["predictions"].create_index([("created_at", -1)])
        await db_instance.db["predictions"].create_index([("sentiment", 1)])
        await db_instance.db["predictions"].create_index([("emotion", 1)])
        await db_instance.db["datasets"].create_index([("created_at", -1)])
        await db_instance.db["model_metrics"].create_index([("model_name", 1)], unique=True)
        logger.info("MongoDB connected and indexes verified successfully.")
    except Exception as e:
        logger.warning(f"MongoDB connection could not be established ({e}). Running in stateless mode.")
        db_instance.client = None
        db_instance.db = None

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        db_instance._db = None
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db
