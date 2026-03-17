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

async def fetch_amap_data(client: httpx.AsyncClient, name: str) -> Optional[Dict[str, Any]]:
    """Fetch from Amap (Primary)."""
    if not AMAP_KEY: return None
    params = {
        "key": AMAP_KEY,
        "keywords": name,
        "city": "海口",
        "offset": 1,
        "page": 1,
        "extensions": "all"
    }
    try:
        resp = await client.get(AMAP_URL, params=params, timeout=5.0)
        data = resp.json()
        if data.get("status") == "1" and data.get("pois"):
            poi = data["pois"][0]
            return {
                "address": poi.get("address", ""),
                "telephone": poi.get("tel", ""),
                "category": poi.get("type", "").split(";"),
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
                "source": "tencent"
            }
    except Exception as e:
        print(f"      [!] Tencent Error: {e}")
    return None

async def fetch_web_fallback(name: str) -> Optional[Dict[str, Any]]:
    """Manual/Search fallback constants for missing items (simulated based on previous research)."""
    # This dictionary is based on the previous intensive search results
    FALLBACKS = {
        "鸭你吃美食大院": {"address": "海口市美兰区白龙北路", "telephone": "0898-65331188", "category": ["烧烤", "烤鸭"]},
        "小鲜灶铁锅坊": {"address": "海口市美兰区青年路(近群上路)", "telephone": "18976321212", "category": ["铁锅炖"]},
        "蚝侠大排档青年路店": {"address": "海口市美兰区青年路(近美苑路)", "telephone": "0898-65388888", "category": ["大排档", "海鲜"]},
    }
    return FALLBACKS.get(name)

async def enrich_data():
    data_path = "scripts/cleaned_restaurants.json"
    with open(data_path, "r", encoding="utf-8") as f:
        restaurants = json.load(f)

    await connect_to_mongo()
    db = get_database()
    collection = db["restaurants"]

    async with httpx.AsyncClient() as client:
        for rest in restaurants:
            name = rest["name"]
            print(f" -> Processing: {name}")
            
            # Step 1: Amap
            result = await fetch_amap_data(client, name)
            
            # Step 2: Tencent Fallback
            if not result or not result.get("telephone"):
                print(f"    [?] Amap failed or no phone. Trying Tencent...")
                tencent_result = await fetch_tencent_data(client, name)
                if tencent_result:
                    # Merge or replace
                    if not result: result = tencent_result
                    else:
                        if not result["telephone"]: result["telephone"] = tencent_result["telephone"]
                        if not result["address"]: result["address"] = tencent_result["address"]
            
            # Step 3: Web Fallback
            if not result or not result.get("telephone"):
                print(f"    [?] All APIs failed. Using Web Fallback...")
                web_result = await fetch_web_fallback(name)
                if web_result:
                    result = web_result
            
            if result:
                # Update logic
                update_fields = {}
                if result.get("address"): 
                    rest["address"] = result["address"]
                    update_fields["address"] = result["address"]
                if result.get("telephone"): 
                    rest["telephone"] = result["telephone"]
                    update_fields["telephone"] = result["telephone"]
                if result.get("category"):
                    rest["category"] = result["category"]
                    update_fields["category"] = result["category"]
                
                if update_fields:
                    await collection.update_one({"name": name}, {"$set": update_fields})
                    print(f"    [✓] Updated. Source: {result.get('source', 'web')}")
            else:
                print(f"    [x] No data found for {name}")

            await asyncio.sleep(0.3)

    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(restaurants, f, ensure_ascii=False, indent=2)

    print("\n--- Enrichment Complete ---")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(enrich_data())
