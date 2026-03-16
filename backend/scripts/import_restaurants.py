import asyncio
import os
import re
import httpx
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# We need to import our app models and db after loading dotenv
from app.models.restaurant import RestaurantCreate, GeoJSONPoint
from app.core.database import connect_to_mongo, close_mongo_connection, get_database

TENCENT_MAP_KEY = os.environ.get("TENCENT_MAP_KEY")
if not TENCENT_MAP_KEY:
    raise ValueError("TENCENT_MAP_KEY is missing in environment variables.")

TENCENT_API_URL = "https://apis.map.qq.com/ws/place/v1/search"

def parse_line(line: str) -> Optional[Dict[str, str]]:
    """Parse a raw line from the text file."""
    line = line.strip()
    if not line or "辖区" in line:
        return None
    
    # Extract district if exists at the beginning
    district_match = re.match(r"^(美兰区|琼山区|龙华区|秀英区)?\s*(.*)", line)
    district = district_match.group(1) if district_match else None
    rest_of_line = district_match.group(2) if district_match else line
    
    parts = rest_of_line.split()
    if not parts:
        return None
        
    name = parts[0]
    
    # We ignore the rest of the manual parts for now, because Tencent Map is our source of truth
    return {
        "district": district,
        "name": name,
        "original_line": line
    }

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
            print(f"    [!] API returned no results or error for: {name} (Message: {data.get('message')})")
            return None
    except Exception as e:
        print(f"    [!] Network error fetching {name}: {e}")
        return None

async def process_restaurants(file_path: str):
    """Main runner to read file, fetch data, and save to DB."""
    mongodb_available = False
    collection = None
    
    try:
        await connect_to_mongo()
        db = get_database()
        collection = db["restaurants"]
        mongodb_available = True
        print("[✓] Connected to MongoDB Atlas.")
    except Exception as e:
        print(f"[!] MongoDB Connection failed (DNS/Network issue): {e}")
        print("[!] Script will continue to generate JSON file but will NOT save to database.")
    
    print("--- Starting Data Import & Cleaning ---")
    
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    collected_data = [] # For exporting to JSON
    
    async with httpx.AsyncClient() as client:
        for line in lines:
            parsed = parse_line(line)
            if not parsed:
                continue
                
            name = parsed["name"]
            district = parsed["district"]
            print(f" -> Processing: {name}")
            
            # Check if it already exists in our DB (if mongodb is available)
            if mongodb_available:
                try:
                    existing = await collection.find_one({"name": name})
                    if existing:
                        print(f"    [✓] {name} already exists in DB. Skipping.")
                        existing["_id"] = str(existing["_id"])
                        collected_data.append(existing)
                        continue
                except Exception as db_err:
                    print(f"    [!] DB Read error (DNS?): {db_err}. Switching to JSON-only mode.")
                    mongodb_available = False

            poi = await fetch_poi_data(client, name)
            if not poi:
                print(f"    [x] Skipping {name} due to missing POI data.")
                continue
            
            try:
                # Map Tencent POI to our Pydantic Model
                location = GeoJSONPoint(
                    coordinates=[float(poi["location"]["lng"]), float(poi["location"]["lat"])]
                )
                
                address = poi.get("address", "")
                tel = poi.get("tel", "")
                
                restaurant_in = RestaurantCreate(
                    name=name,
                    category=["餐饮"],
                    location=location,
                    address=address,
                    source="crawler",
                    is_verified=False
                )
                
                restaurant_dict = restaurant_in.model_dump()
                if tel:
                    restaurant_dict["telephone"] = tel
                if district:
                    restaurant_dict["district"] = district
                    
                if mongodb_available:
                    try:
                        result = await collection.insert_one(restaurant_dict)
                        restaurant_dict["_id"] = str(result.inserted_id)
                    except Exception as ins_err:
                        print(f"    [!] DB Insert error: {ins_err}. Saving to JSON only.")
                        mongodb_available = False
                        import uuid
                        restaurant_dict["_id"] = str(uuid.uuid4())
                else:
                    # Fake an ID for the JSON export if no DB
                    import uuid
                    restaurant_dict["_id"] = str(uuid.uuid4())
                
                collected_data.append(restaurant_dict)
                print(f"    [+] Successfully processed {name} (Exported to JSON).")
                
            except Exception as e:
                print(f"    [!] Failed to validate or process {name}: {e}")
                
            await asyncio.sleep(0.2)
    
    # Export to JSON file
    import json
    export_path = os.path.join(os.path.dirname(file_path), "cleaned_restaurants.json")
    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(collected_data, f, ensure_ascii=False, indent=2)
    print(f"--- Data exported to: {export_path} ---")
            
    if mongodb_available:
        await close_mongo_connection()
    print("--- Data Processing Finished ---")

if __name__ == "__main__":
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(script_dir, "raw_data.txt")
    asyncio.run(process_restaurants(data_file))
