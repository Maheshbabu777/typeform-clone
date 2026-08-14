from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import ai, forms, logic_rules, public, questions, results
from app.db_init import init_database

from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.extension import _rate_limit_exceeded_handler

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema and default creator exist on startup
    init_database()
    yield

app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.api_route("/health", methods=["GET", "HEAD"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.state.limiter = ai.limiter

app.include_router(ai.router)
app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(logic_rules.router)
app.include_router(public.router)
app.include_router(results.router)
