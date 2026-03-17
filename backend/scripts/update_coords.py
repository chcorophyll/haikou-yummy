import asyncio
import os
import json
import httpx
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

# Load env before local imports
load_dotenv()

try:
    from app.core.database import connect_to_mongo, close_mongo_connection, get_database
    HAS_DB_UTILS = True
except ImportError:
    HAS_DB_UTILS = False
    print("[!] Database utils not found, will only update local JSON.")

AMAP_KEY = os.environ.get("AMAP_KEY")
AMAP_URL = "https://restapi.amap.com/v3/place/text"

async def fetch_high_precision_coord(client: httpx.AsyncClient, name: str, address: str) -> Optional[str]:
    """Fetch high precision coordinates from Amap."""
    if not AMAP_KEY: return None
    
    # Try searching by name + city first
    params = {
        "key": AMAP_KEY,
        "keywords": name,
        "city": "海口",
        "offset": 1,
        "page": 1,
        "extensions": "base"
    }
    
    try:
        resp = await client.get(AMAP_URL, params=params, timeout=5.0)
        data = resp.json()
        if data.get("status") == "1" and data.get("pois"):
            # Find the best match
            for poi in data["pois"]:
                # Basic check if it's actually in Haikou
                if "海口" in poi.get("cityname", ""):
                    return poi.get("location") # "lng,lat"
    except Exception as e:
        print(f"      [!] Amap API Error for {name}: {e}")
    
    return None

async def update_coords():
    data_path = "scripts/cleaned_restaurants.json"
    if not os.path.exists(data_path):
        # Try absolute path if relative fails in some contexts
        data_path = "/Users/kexin2050/haikou-yummy/backend/scripts/cleaned_restaurants.json"
        if not os.path.exists(data_path):
            print(f"Error: {data_path} not found.")
            return

    with open(data_path, "r", encoding="utf-8") as f:
        restaurants = json.load(f)

    if HAS_DB_UTILS:
        await connect_to_mongo()
        db = get_database()
        collection = db["restaurants"]

    print(f"--- Starting Coordinate Update (Source: Amap) ---")
    
    updated_count = 0
    async with httpx.AsyncClient() as client:
        for rest in restaurants:
            name = rest["name"]
            address = rest.get("address", "")
            old_loc = rest.get("location", {}).get("coordinates", [])
            
            print(f" -> Checking: {name}")
            
            new_coord_str = await fetch_high_precision_coord(client, name, address)
            
            if new_coord_str:
                try:
                    lng, lat = map(float, new_coord_str.split(","))
                    new_loc = [lng, lat]
                    
                    if old_loc != new_loc:
                        print(f"    [↑] Updating: {old_loc} -> {new_loc}")
                        rest["location"] = {
                            "type": "Point",
                            "coordinates": new_loc
                        }
                        
                        if HAS_DB_UTILS:
                            await collection.update_one(
                                {"name": name},
                                {"$set": {"location": rest["location"]}}
                            )
                        updated_count += 1
                    else:
                        print(f"    [-] Already accurate.")
                except Exception as e:
                    print(f"    [!] Split error for {name}: {e}")
            else:
                print(f"    [x] No high-precision match found for {name}.")

            await asyncio.sleep(0.2) # Rate limit protection

    # Save updated JSON
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(restaurants, f, ensure_ascii=False, indent=2)
    
    print(f"\n--- Update Complete. {updated_count} coordinates changed. ---")
    
    if HAS_DB_UTILS:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(update_coords())
