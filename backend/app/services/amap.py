import httpx
from typing import Optional, Dict, Any
from app.core.config import settings

AMAP_URL = "https://restapi.amap.com/v3/place/text"
DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop"

class AmapService:
    @staticmethod
    async def fetch_restaurant_data(name: str) -> Optional[Dict[str, Any]]:
        """Fetch restaurant details from Amap API."""
        if not settings.AMAP_KEY:
            return None
            
        params = {
            "key": settings.AMAP_KEY,
            "keywords": name,
            "city": "海口",
            "offset": 1,
            "page": 1,
            "extensions": "all"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(AMAP_URL, params=params, timeout=5.0)
                data = resp.json()
                if data.get("status") == "1" and data.get("pois"):
                    poi = data["pois"][0]
                    
                    # Ensure it's in Haikou
                    if "海口" not in poi.get("cityname", ""):
                        return None

                    # Extract image
                    image_url = DEFAULT_IMAGE_URL
                    photos = poi.get("photos", [])
                    if photos and isinstance(photos, list) and len(photos) > 0:
                        image_url = photos[0].get("url", DEFAULT_IMAGE_URL)
                    
                    # Parse location
                    location = None
                    if poi.get("location"):
                        try:
                            lng_str, lat_str = poi["location"].split(",")
                            location = {
                                "type": "Point",
                                "coordinates": [float(lng_str), float(lat_str)]
                            }
                        except Exception:
                            pass

                    return {
                        "address": poi.get("address"),
                        "telephone": poi.get("tel"),
                        "category": poi.get("type", "").split(";"),
                        "images": [image_url],
                        "location": location,
                        "source": "amap"
                    }
            except Exception:
                pass
        return None
