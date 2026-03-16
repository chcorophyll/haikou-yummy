import asyncio
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Set test environment overrides BEFORE importing the app
os.environ["DATABASE_NAME"] = "test_haikou_yummy"
# Assume local mongodb runs on 27017, can be overridden by environment
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")

from app.main import app
from app.core.database import connect_to_mongo, close_mongo_connection, get_database

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
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

@pytest_asyncio.fixture(autouse=True)
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
