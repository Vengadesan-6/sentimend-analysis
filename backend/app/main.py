import os
import threading
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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("SentixMain")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect DB safely (non-blocking)
    logger.info("Initializing Sentix AI Platform...")
    try:
        await connect_to_mongo()
    except Exception as e:
        logger.warning(f"Handled database startup warning: {e}")

    yield

    # Shutdown
    logger.info("Shutting down Sentix AI Platform...")
    try:
        await close_mongo_connection()
    except Exception as e:
        logger.warning(f"Handled database shutdown warning: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI Sentiment Intelligence Platform with Transformers, Emotion Detection, ABSA, and Explainable AI",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
cors_origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["https://sentimend-analysis.vercel.app"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://sentimend-analysis.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
app.include_router(health.router, tags=["Health"])
app.include_router(predict.router, prefix=settings.API_PREFIX, tags=["Inference"])
app.include_router(predict.router, tags=["Inference"])
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
        "health": "/health",
        "api_health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", str(settings.PORT)))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=settings.DEBUG)
