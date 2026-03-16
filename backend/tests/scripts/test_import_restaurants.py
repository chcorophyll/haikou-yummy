import pytest
import httpx
import os
from scripts.import_restaurants import parse_line, fetch_poi_data
from app.models.restaurant import RestaurantCreate, GeoJSONPoint

def test_parse_line_standard():
    line = "美兰区 鸿运饭店  蓝天路20号 138xxxx"
    parsed = parse_line(line)
    assert parsed is not None
    assert parsed["district"] == "美兰区"
    assert parsed["name"] == "鸿运饭店"

def test_parse_line_no_space_district():
    line = "美兰区小鲜灶铁锅坊"
    parsed = parse_line(line)
    assert parsed is not None
    assert parsed["district"] == "美兰区"
    assert parsed["name"] == "小鲜灶铁锅坊"

def test_parse_line_ignore_header():
    line = "辖区 饭店 详细地址 联系电话 消费次数"
    parsed = parse_line(line)
    assert parsed is None

@pytest.mark.asyncio
async def test_fetch_poi_data_success(respx_mock):
    # Mock Tencent Map API
    respx_mock.get("https://apis.map.qq.com/ws/place/v1/search").mock(return_value=httpx.Response(200, json={
        "status": 0,
        "message": "query ok",
        "data": [
            {
                "id": "12345",
                "title": "鸭你吃美食大院",
                "address": "海口市美兰区某街道",
                "tel": "12345678",
                "location": {
                    "lat": 20.03,
                    "lng": 110.34
                }
            }
        ]
    }))

    async with httpx.AsyncClient() as client:
        poi = await fetch_poi_data(client, "鸭你吃美食大院")
        
        assert poi is not None
        assert poi["location"]["lat"] == 20.03
        assert poi["address"] == "海口市美兰区某街道"

@pytest.mark.asyncio
async def test_fetch_poi_data_not_found(respx_mock):
    # Mock no results
    respx_mock.get("https://apis.map.qq.com/ws/place/v1/search").mock(return_value=httpx.Response(200, json={
        "status": 0,
        "message": "query ok",
        "data": []
    }))

    async with httpx.AsyncClient() as client:
        poi = await fetch_poi_data(client, "并不存在的店")
        assert poi is None

def test_restaurant_create_schema_validation():
    # Test our Pydantic schema validation as planned
    poi_data = {
        "location": {"lng": 110.34, "lat": 20.03},
        "address": "测试地址"
    }
    
    restaurant = RestaurantCreate(
        name="测试饭店",
        location=GeoJSONPoint(coordinates=[poi_data["location"]["lng"], poi_data["location"]["lat"]]),
        address=poi_data["address"],
        source="crawler"
    )
    
    assert restaurant.name == "测试饭店"
    assert restaurant.location.coordinates == [110.34, 20.03]
    assert restaurant.source == "crawler"
    assert restaurant.is_verified is False # Default
