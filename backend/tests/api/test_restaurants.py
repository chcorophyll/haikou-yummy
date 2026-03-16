import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_root(async_client: AsyncClient):
    response = await async_client.get("/")
    assert response.status_code == 200
    assert "Haikou Yummy API" in response.json()["message"]

async def test_create_restaurant(async_client: AsyncClient):
    payload = {
        "name": "Testing Resto",
        "category": ["Food"],
        "location": {
            "type": "Point",
            "coordinates": [110.334001, 20.038481]
        },
        "price_per_person": 50
    }
    response = await async_client.post("/api/v1/restaurants/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Testing Resto"
    assert "_id" in data
    assert data["location"]["coordinates"][0] == 110.334001

async def test_create_restaurant_missing_location(async_client: AsyncClient):
    payload = {"name": "No Location Resto"}
    response = await async_client.post("/api/v1/restaurants/", json=payload)
    assert response.status_code == 422 # Unprocessable Entity

async def test_list_restaurants(async_client: AsyncClient):
    # Insert two records
    payload1 = {
        "name": "Resto 1",
        "location": {"type": "Point", "coordinates": [110.0, 20.0]}
    }
    payload2 = {
        "name": "Resto 2",
        "location": {"type": "Point", "coordinates": [110.1, 20.1]}
    }
    await async_client.post("/api/v1/restaurants/", json=payload1)
    await async_client.post("/api/v1/restaurants/", json=payload2)

    response = await async_client.get("/api/v1/restaurants/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

async def test_get_nearby_restaurants(async_client: AsyncClient):
    # Near restaurant
    payload_near = {
        "name": "Near Resto",
        "location": {"type": "Point", "coordinates": [110.334000, 20.038400]}
    }
    # Far restaurant
    payload_far = {
        "name": "Far Resto",
        "location": {"type": "Point", "coordinates": [110.500000, 20.200000]}
    }
    await async_client.post("/api/v1/restaurants/", json=payload_near)
    await async_client.post("/api/v1/restaurants/", json=payload_far)

    # Search nearby near location
    response = await async_client.get("/api/v1/restaurants/nearby/?longitude=110.334000&latitude=20.038500&max_distance=5000")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Near Resto"

async def test_get_restaurant_detail(async_client: AsyncClient):
    payload = {
        "name": "Detail Resto",
        "location": {"type": "Point", "coordinates": [110.0, 20.0]}
    }
    create_resp = await async_client.post("/api/v1/restaurants/", json=payload)
    resto_id = create_resp.json()["_id"]

    # Valid ID
    get_resp = await async_client.get(f"/api/v1/restaurants/{resto_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Detail Resto"

    # Non-existent ID
    fake_id = "507f1f77bcf86cd799439011"
    not_found_resp = await async_client.get(f"/api/v1/restaurants/{fake_id}")
    assert not_found_resp.status_code == 404

    # Invalid ID Format
    bad_id_resp = await async_client.get("/api/v1/restaurants/invalid_id_format")
    assert bad_id_resp.status_code == 400
