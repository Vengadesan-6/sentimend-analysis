import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.app.config import settings
from backend.app.database import connect_to_mongo, close_mongo_connection
from backend.app.middleware import LoggingAndTimingMiddleware
from backend.app.routes import health, predict, predictions, analytics, models
from ml.inference import SentimentIntelligencePipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("SentixMain")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect DB and Warm up Models
    logger.info("Initializing Sentix AI Platform...")
    await connect_to_mongo()
    
    logger.info("Warming up ML Singleton Pipeline...")
    try:
        pipeline = SentimentIntelligencePipeline.get_instance()
        warmup_res = pipeline.analyze_single("System startup initialization check.")
        logger.info(f"Model engine warmed up successfully in {warmup_res['processing_time_ms']}ms.")
    except Exception as e:
        logger.error(f"Error warming up ML models: {e}")

    yield

    # Shutdown
    logger.info("Shutting down Sentix AI Platform...")
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI Sentiment Intelligence Platform with Transformers, Emotion Detection, ABSA, and Explainable AI",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for seamless local dev & network access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware
app.add_middleware(LoggingAndTimingMiddleware)

# Custom Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Input validation error",
            "errors": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": f"Server error: {str(exc)}"
        }
    )

# Include Routers
app.include_router(health.router, prefix=settings.API_PREFIX, tags=["Health"])
app.include_router(predict.router, prefix=settings.API_PREFIX, tags=["Inference"])
app.include_router(predictions.router, prefix=settings.API_PREFIX, tags=["Predictions"])
app.include_router(analytics.router, prefix=settings.API_PREFIX, tags=["Analytics"])
app.include_router(models.router, prefix=settings.API_PREFIX, tags=["Model Performance"])

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
