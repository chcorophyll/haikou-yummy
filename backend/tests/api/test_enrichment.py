import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock

pytestmark = pytest.mark.asyncio

@patch("app.services.amap.httpx.AsyncClient.get")
@pytest.mark.asyncio
async def test_create_restaurant_with_enrichment(mock_get, async_client: AsyncClient, setup_database):
    # Mock Amap API response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "status": "1",
        "pois": [{
            "name": "阿浪海鲜",
            "address": "海口市美兰区海甸岛",
            "tel": "0898-12345678",
            "type": "美食;海鲜酒楼",
            "cityname": "海口市",
            "location": "110.334001,20.038481",
            "photos": [{"url": "http://example.com/photo.jpg"}]
        }]
    }
    mock_get.return_value = mock_response

    payload = {
        "name": "阿浪海鲜",
        # address is missing
        "location": {
            "type": "Point",
            "coordinates": [0, 0] # Default/Generic
        },
        "source": "ugc"
    }
    
    # We need to ensure AMAP_KEY is "set" for the service to run
    with patch("app.services.amap.settings.AMAP_KEY", "test_key"):
        response = await async_client.post("/api/v1/restaurants/", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "阿浪海鲜"
    assert data["address"] == "海口市美兰区海甸岛"
    assert data["telephone"] == "0898-12345678"
    assert "海鲜酒楼" in data["category"]
    assert data["location"]["coordinates"] == [110.334001, 20.038481]
    assert "http://example.com/photo.jpg" in data["images"]
