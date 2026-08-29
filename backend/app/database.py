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
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=4000)
    db_instance.db = db_instance.client[settings.DATABASE_NAME]
    
    # Create indexes for optimal querying
    try:
        await db_instance.db["predictions"].create_index([("created_at", -1)])
        await db_instance.db["predictions"].create_index([("sentiment", 1)])
        await db_instance.db["predictions"].create_index([("emotion", 1)])
        await db_instance.db["datasets"].create_index([("created_at", -1)])
        await db_instance.db["model_metrics"].create_index([("model_name", 1)], unique=True)
        logger.info("MongoDB connected and indexes verified successfully.")
    except Exception as e:
        logger.warning(f"MongoDB connected, but index creation encountered: {e}")

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        db_instance._db = None
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db
