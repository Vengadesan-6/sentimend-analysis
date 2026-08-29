import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from fastapi.responses import JSONResponse

logger = logging.getLogger("SentixAPI")

class LoggingAndTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        try:
            response = await call_next(request)
            process_time = (time.perf_counter() - start_time) * 1000.0
            response.headers["X-Process-Time-MS"] = str(round(process_time, 2))
            
            # Log cleanly without dumping raw request bodies
            logger.info(
                f"{request.method} {request.url.path} - Status: {response.status_code} - {process_time:.2f}ms"
            )
            return response
            
        except Exception as exc:
            process_time = (time.perf_counter() - start_time) * 1000.0
            logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": f"An internal server error occurred: {str(exc)}",
                    "data": None
                }
            )
