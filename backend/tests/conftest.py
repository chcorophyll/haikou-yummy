import asyncio
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# FORCE test environment overrides BEFORE importing the app
# Use a dedicated test database name to prevent accidental production data loss
os.environ["DATABASE_NAME"] = "test_haikou_yummy_v2" 
# Use the real MongoDB URL if available in .env, otherwise fallback to local for development
if not os.environ.get("MONGODB_URL"):
    os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")

from app.main import app
from app.core.database import connect_to_mongo, close_mongo_connection, get_database

@pytest_asyncio.fixture(scope="session")
async def setup_database():
    """Initialize DB connection and index once per session."""
    await connect_to_mongo()
    db = get_database()
    # Provide necessary index for spatial queries
    await db["restaurants"].create_index([("location", "2dsphere")])
    yield
    # Teardown
    await db.client.drop_database(os.environ["DATABASE_NAME"])
    await close_mongo_connection()

@pytest_asyncio.fixture()
async def clear_collections():
    """Clear test data from the database before each test execution."""
    db = get_database()
    await db["restaurants"].delete_many({})
    yield

@pytest_asyncio.fixture
async def async_client():
    """Provide an asynchronous httpx client connected to the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
