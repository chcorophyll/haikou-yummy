from fastapi import APIRouter, HTTPException, Query
from typing import List
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId

from app.models.restaurant import RestaurantInDB, RestaurantCreate
from app.core.database import get_database
from app.services.amap import AmapService

router = APIRouter()

def get_restaurant_collection() -> AsyncIOMotorCollection:
    db = get_database()
    return db["restaurants"]

@router.post("/", response_model=RestaurantInDB, status_code=201)
async def create_restaurant(restaurant: RestaurantCreate):
    collection = get_restaurant_collection()
    restaurant_dict = restaurant.model_dump()
    
    # Data Enrichment: If address is missing or name is provided, try Amap
    if not restaurant_dict.get("address") or restaurant_dict.get("source") == "ugc":
        enriched_data = await AmapService.fetch_restaurant_data(restaurant_dict["name"])
        if enriched_data:
            # Update fields if they are missing in the original request
            if not restaurant_dict.get("address"):
                restaurant_dict["address"] = enriched_data["address"]
            if not restaurant_dict.get("telephone"):
                restaurant_dict["telephone"] = enriched_data["telephone"]
            if not restaurant_dict.get("category"):
                restaurant_dict["category"] = enriched_data["category"]
            if not restaurant_dict.get("images"):
                restaurant_dict["images"] = enriched_data["images"]
            
            # Update location if it's the default or missing (simplified check)
            # For simplicity, we overwrite location if enriched data has it and source is UGC
            if enriched_data.get("location"):
                restaurant_dict["location"] = enriched_data["location"]

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

@router.put("/{restaurant_id}", response_model=RestaurantInDB)
async def update_restaurant(restaurant_id: str, restaurant: RestaurantCreate):
    collection = get_restaurant_collection()
    try:
        obj_id = ObjectId(restaurant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID 格式无效")
    
    update_data = restaurant.model_dump()
    result = await collection.update_one({"_id": obj_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="餐厅不存在")
        
    updated_doc = await collection.find_one({"_id": obj_id})
    updated_doc["_id"] = str(updated_doc["_id"])
    return RestaurantInDB(**updated_doc)

@router.patch("/{restaurant_id}/verify", response_model=RestaurantInDB)
async def verify_restaurant(restaurant_id: str, verified: bool = Query(...)):
    collection = get_restaurant_collection()
    try:
        obj_id = ObjectId(restaurant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID 格式无效")
    
    result = await collection.update_one({"_id": obj_id}, {"$set": {"is_verified": verified}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="餐厅不存在")
        
    updated_doc = await collection.find_one({"_id": obj_id})
    updated_doc["_id"] = str(updated_doc["_id"])
    return RestaurantInDB(**updated_doc)

@router.delete("/{restaurant_id}", status_code=204)
async def delete_restaurant(restaurant_id: str):
    collection = get_restaurant_collection()
    try:
        obj_id = ObjectId(restaurant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID 格式无效")
    
    result = await collection.delete_one({"_id": obj_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="餐厅不存在")
    return None
