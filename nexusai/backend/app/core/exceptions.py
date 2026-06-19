import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = structlog.get_logger("nexusai.exceptions")

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        if exc.status_code in (401, 404):
            logger.info("http_exception", path=request.url.path, status_code=exc.status_code, detail=exc.detail)
        else:
            logger.warning("http_exception", path=request.url.path, status_code=exc.status_code, detail=exc.detail)
        message = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "ok": False,
                "detail": message,
                "error": {
                    "code": getattr(exc, "error_code", "http_error"),
                    "message": message,
                    "details": exc.detail if not isinstance(exc.detail, str) else None,
                }
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        logger.warning("validation_error", path=request.url.path, errors=exc.errors())
        # Format the pydantic errors nicely
        formatted_errors = [{"field": ".".join(map(str, e["loc"])), "message": e["msg"]} for e in exc.errors()]
        return JSONResponse(
            status_code=422,
            content={
                "ok": False,
                "detail": "Invalid request payload",
                "error": {
                    "code": "validation_error",
                    "message": "Invalid request payload",
                    "details": formatted_errors
                },
                "errors": formatted_errors,
            }
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_server_error", path=request.url.path, error=str(exc))
        return JSONResponse(
            status_code=500,
            content={
                "ok": False,
                "detail": "An unexpected error occurred. Our engineers have been notified.",
                "error": {
                    "code": "internal_server_error",
                    "message": "An unexpected error occurred. Our engineers have been notified."
                }
            }
        )
