from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .core.config import settings
from .core.database import connect_to_mongo, close_mongo_connection, get_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Permissive CORS for debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # Log the Origin for debugging
    origin = request.headers.get("origin")
    if origin:
        print(f"Request from Origin: {origin}")
    response = await call_next(request)
    return response

from .api.endpoints import restaurants
app.include_router(restaurants.router, prefix="/api/v1/restaurants", tags=["restaurants"])

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

@app.get("/api/v1/health")
async def health():
    db = get_database()
    count = await db["restaurants"].count_documents({})
    return {"status": "ok", "restaurant_count": count}
