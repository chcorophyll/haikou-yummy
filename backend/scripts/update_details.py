import asyncio
import os
import json
import httpx
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# We need to import our app models and db after loading dotenv
from app.core.database import connect_to_mongo, close_mongo_connection, get_database

TENCENT_MAP_KEY = os.environ.get("TENCENT_MAP_KEY")
TENCENT_API_URL = "https://apis.map.qq.com/ws/place/v1/search"

async def fetch_poi_data(client: httpx.AsyncClient, name: str) -> Optional[Dict[str, Any]]:
    """Fetch restaurant data from Tencent Map API."""
    params = {
        "keyword": name,
        "boundary": "region(海口市,0)",
        "key": TENCENT_MAP_KEY,
        "page_size": 1
    }
    try:
        response = await client.get(TENCENT_API_URL, params=params, timeout=10.0)
        data = response.json()
        if data.get("status") == 0 and data.get("data"):
            return data["data"][0]
        else:
            print(f"    [!] API returned no results or error for: {name} (Status: {data.get('status')}, Message: {data.get('message')})")
            return None
    except Exception as e:
        print(f"    [!] Network error fetching {name}: {e}")
        return None

async def update_restaurants():
    """Update detailed info for existing restaurants using Tencent Map API."""
    data_path = "scripts/cleaned_restaurants.json"
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        restaurants = json.load(f)

    await connect_to_mongo()
    db = get_database()
    collection = db["restaurants"]
    print("[✓] Connected to MongoDB.")

    print(f"--- Starting Updates for {len(restaurants)} restaurants ---")
    
    async with httpx.AsyncClient() as client:
        for rest in restaurants:
            name = rest["name"]
            print(f" -> Updating: {name}")
            
            poi = await fetch_poi_data(client, name)
            if not poi:
                print(f"    [x] No POI found for {name}. Keeping current data.")
                continue
            
            # Map Tencent POI to fields
            new_address = poi.get("address", "")
            new_tel = poi.get("tel", "")
            
            # Update local dict
            if new_address:
                rest["address"] = new_address
            if new_tel:
                rest["telephone"] = new_tel
            
            # Update MongoDB
            update_data = {}
            if new_address: update_data["address"] = new_address
            if new_tel: update_data["telephone"] = new_tel
            
            if update_data:
                await collection.update_one(
                    {"name": name},
                    {"$set": update_data}
                )
                print(f"    [✓] Updated {name} with Address: {new_address}, Tel: {new_tel}")
            
            # Small delay to avoid hitting QPS limits
            await asyncio.sleep(0.5)

    # Save updated JSON
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(restaurants, f, ensure_ascii=False, indent=2)
    
    print("\n--- All updates finished and saved to JSON ---")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(update_restaurants())
