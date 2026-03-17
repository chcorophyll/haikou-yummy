import asyncio
import os
import json
import httpx
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

from app.core.database import connect_to_mongo, close_mongo_connection, get_database

AMAP_KEY = os.environ.get("AMAP_KEY")
TENCENT_MAP_KEY = os.environ.get("TENCENT_MAP_KEY")

AMAP_URL = "https://restapi.amap.com/v3/place/text"
TENCENT_URL = "https://apis.map.qq.com/ws/place/v1/search"

# Global Default Image URL (High-quality food placeholder)
DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop"

async def fetch_amap_data(client: httpx.AsyncClient, name: str) -> Optional[Dict[str, Any]]:
    """Fetch from Amap (Primary)."""
    if not AMAP_KEY: return None
    params = {
        "key": AMAP_KEY,
        "keywords": name,
        "city": "海口",
        "offset": 1,
        "page": 1,
        "extensions": "all" # Necessary to get photos
    }
    try:
        resp = await client.get(AMAP_URL, params=params, timeout=5.0)
        data = resp.json()
        if data.get("status") == "1" and data.get("pois"):
            poi = data["pois"][0]
            
            # Ensure it's in Haikou
            if "海口" not in poi.get("cityname", ""):
                print(f"      [!] POI {name} is in {poi.get('cityname')}, skipping.")
                return None

            # Extract image
            image_url = DEFAULT_IMAGE_URL
            photos = poi.get("photos", [])
            if photos and isinstance(photos, list) and len(photos) > 0:
                image_url = photos[0].get("url", DEFAULT_IMAGE_URL)
            
            return {
                "address": poi.get("address", ""),
                "telephone": poi.get("tel", ""),
                "category": poi.get("type", "").split(";"),
                "image_url": image_url,
                "location": poi.get("location", ""), # Format: "lng,lat"
                "district": poi.get("adname", ""), # District name
                "source": "amap"
            }
    except Exception as e:
        print(f"      [!] Amap Error: {e}")
    return None

async def fetch_tencent_data(client: httpx.AsyncClient, name: str) -> Optional[Dict[str, Any]]:
    """Fetch from Tencent (Fallback)."""
    if not TENCENT_MAP_KEY: return None
    params = {
        "keyword": name,
        "boundary": "region(海口市,0)",
        "key": TENCENT_MAP_KEY,
        "page_size": 1
    }
    try:
        resp = await client.get(TENCENT_URL, params=params, timeout=5.0)
        data = resp.json()
        if data.get("status") == 0 and data.get("data"):
            poi = data["data"][0]
            return {
                "address": poi.get("address", ""),
                "telephone": poi.get("tel", ""),
                "category": poi.get("category", "").split(":"),
                "image_url": DEFAULT_IMAGE_URL, # Tencent basic POI doesn't always have photos easily accessible
                "source": "tencent"
            }
    except Exception as e:
        print(f"      [!] Tencent Error: {e}")
    return None

async def fetch_web_fallback(name: str) -> Optional[Dict[str, Any]]:
    """Manual/Search fallback constants for missing items."""
    FALLBACKS = {
        "鸭你吃美食大院": {"address": "海口市美兰区白龙北路", "telephone": "0898-65331188", "category": ["烧烤", "烤鸭"], "image_url": DEFAULT_IMAGE_URL},
        "小鲜灶铁锅坊": {"address": "海口市美兰区青年路(近群上路)", "telephone": "18976321212", "category": ["铁锅炖"], "image_url": DEFAULT_IMAGE_URL},
        "蚝侠大排档青年路店": {"address": "海口市美兰区青年路(近美苑路)", "telephone": "0898-65388888", "category": ["大排档", "海鲜"], "image_url": DEFAULT_IMAGE_URL},
    }
    return FALLBACKS.get(name)

async def enrich_data():
    data_path = "scripts/cleaned_restaurants.json"
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        restaurants = json.load(f)

    await connect_to_mongo()
    db = get_database()
    collection = db["restaurants"]

    print(f"--- Starting Final Data Refinement (Priority: Amap) ---")
    
    async with httpx.AsyncClient() as client:
        for rest in restaurants:
            name = rest["name"]
            print(f" -> Updating: {name}")
            
            # Use Amap as primary and OVERWRITE
            result = await fetch_amap_data(client, name)
            
            # Fallback only if Amap completely fails
            if not result:
                print(f"    [!] Amap failed for {name}. Using fallbacks...")
                result = await fetch_tencent_data(client, name)
            
            if not result:
                result = await fetch_web_fallback(name)
            
            if result:
                # Update local dict (Always overwrite)
                raw_address = result.get("address", rest.get("address", ""))
                if isinstance(raw_address, list):
                    rest["address"] = ", ".join(raw_address) if raw_address else ""
                else:
                    rest["address"] = str(raw_address)
                
                rest["telephone"] = result.get("telephone", rest.get("telephone", ""))
                rest["category"] = result.get("category", rest.get("category", []))
                rest["images"] = [result["image_url"]] if result.get("image_url") else [DEFAULT_IMAGE_URL]
                rest["district"] = result.get("district", rest.get("district", ""))
                
                # Update Coordinates if available
                if result.get("location"):
                    try:
                        lng_str, lat_str = result["location"].split(",")
                        lng, lat = float(lng_str), float(lat_str)
                        
                        # Bounding box check for Haikou land area
                        # Rough bounds: Lng 110.1-110.6, Lat 19.8-20.1
                        if 110.1 <= lng <= 110.6 and 19.8 <= lat <= 20.1:
                            old_loc = rest.get("location", {}).get("coordinates", [])
                            new_loc = [lng, lat]
                            if old_loc != new_loc:
                                print(f"    [↑] Location shift: {old_loc} -> {new_loc}")
                            
                            rest["location"] = {
                                "type": "Point",
                                "coordinates": new_loc
                            }
                        else:
                            print(f"    [!] Coordinate {lng},{lat} out of Haikou land bounds, skipping location update.")
                    except Exception as e:
                        print(f"    [!] Coordinate parse error for {name}: {e}")

                # Update MongoDB
                update_data = {
                    "address": rest["address"],
                    "telephone": rest["telephone"],
                    "category": rest["category"],
                    "images": rest["images"],
                    "location": rest.get("location"),
                    "district": rest.get("district")
                }
                
                await collection.update_one(
                    {"name": name},
                    {"$set": update_data}
                )
                print(f"    [✓] Refined from {result.get('source', 'unknown')}.")
            else:
                print(f"    [x] No source found for {name}. Setting default image.")
                rest["images"] = [DEFAULT_IMAGE_URL]
                await collection.update_one(
                    {"name": name},
                    {"$set": {"images": [DEFAULT_IMAGE_URL]}}
                )

            await asyncio.sleep(0.3)

    # Save updated JSON
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(restaurants, f, ensure_ascii=False, indent=2)
    
    print("\n--- Final Refinement Complete and Saved ---")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(enrich_data())
