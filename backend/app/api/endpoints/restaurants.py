from fastapi import APIRouter, HTTPException, Query
from typing import List
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId

from app.models.restaurant import RestaurantInDB, RestaurantCreate
from app.core.database import get_database

router = APIRouter()

def get_restaurant_collection() -> AsyncIOMotorCollection:
    db = get_database()
    return db["restaurants"]

@router.post("/", response_model=RestaurantInDB, status_code=201)
async def create_restaurant(restaurant: RestaurantCreate):
    collection = get_restaurant_collection()
    restaurant_dict = restaurant.model_dump()
    result = await collection.insert_one(restaurant_dict)
    
    # Ensure spatial index for geo queries
    await collection.create_index([("location", "2dsphere")])

    created_restaurant = await collection.find_one({"_id": result.inserted_id})
    created_restaurant["_id"] = str(created_restaurant["_id"])
    return RestaurantInDB(**created_restaurant)

@router.get("/", response_model=List[RestaurantInDB])
async def list_restaurants(
    limit: int = 100, 
    skip: int = 0,
    q: str = Query(None, description="搜索餐厅名称 (Search by restaurant name)")
):
    collection = get_restaurant_collection()
    query = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
        
    restaurants = []
    cursor = collection.find(query).skip(skip).limit(limit)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        restaurants.append(RestaurantInDB(**document))
    return restaurants

@router.get("/nearby/", response_model=List[RestaurantInDB])
async def get_nearby_restaurants(
    longitude: float = Query(..., description="经度 (Longitude)"),
    latitude: float = Query(..., description="纬度 (Latitude)"),
    max_distance: int = Query(5000, description="最大搜索半径（米）")
):
    collection = get_restaurant_collection()
    restaurants = []
    
    query = {
        "location": {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "$maxDistance": max_distance
            }
        }
    }
    
    try:
        cursor = collection.find(query)
        async for document in cursor:
            document["_id"] = str(document["_id"])
            restaurants.append(RestaurantInDB(**document))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return restaurants

@router.get("/{restaurant_id}", response_model=RestaurantInDB)
async def get_restaurant(restaurant_id: str):
    collection = get_restaurant_collection()
    try:
        obj_id = ObjectId(restaurant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID 格式无效")
        
    document = await collection.find_one({"_id": obj_id})
    if document:
        document["_id"] = str(document["_id"])
        return RestaurantInDB(**document)
    raise HTTPException(status_code=404, detail="餐厅不存在")
