import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def restore():
    load_dotenv()
    url = os.environ.get("MONGODB_URL")
    db_name = os.environ.get("DATABASE_NAME", "haikou_yummy")
    
    print(f"Connecting to {url[:25]}...")
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    collection = db["restaurants"]
    
    json_path = "scripts/cleaned_restaurants.json"
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        restaurants = json.load(f)
    
    print(f"Found {len(restaurants)} restaurants in JSON.")
    
    # Remove _id from JSON if it exists to let MongoDB generate new ones or keep them
    # Actually, it's better to keep _id if we want to maintain consistency with previous state
    # But some might be strings, need to convert to ObjectId if needed. 
    # For simplicity, if they have _id, we use it as is if it's a string, MongoDB will handle it.
    
    # Clear existing if any (should be empty anyway)
    await collection.delete_many({})
    
    if restaurants:
        result = await collection.insert_many(restaurants)
        print(f"Successfully restored {len(result.inserted_ids)} restaurants.")
        
        # Re-create spatial index
        await collection.create_index([("location", "2dsphere")])
        print("Created spatial index on 'location'.")
    else:
        print("No restaurants to restore.")

    client.close()

if __name__ == "__main__":
    asyncio.run(restore())
