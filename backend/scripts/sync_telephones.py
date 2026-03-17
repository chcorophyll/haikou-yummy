import asyncio
import json
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URL = os.environ.get("MONGODB_URL")

async def sync_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client["haikou_yummy"]
    collection = db["restaurants"]
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "cleaned_restaurants.json")
    
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"Starting sync of {len(data)} restaurants...")
    
    for item in data:
        name = item.get("name")
        telephone = item.get("telephone")
        address = item.get("address")
        
        if not name:
            continue
            
        update_fields = {}
        if telephone:
            update_fields["telephone"] = telephone
        if address:
            # Handle list address if any
            if isinstance(address, list):
                address = ", ".join(address) if address else ""
            if address:
                update_fields["address"] = address
        
        if update_fields:
            result = await collection.update_one(
                {"name": name},
                {"$set": update_fields}
            )
            if result.modified_count > 0:
                print(f" [✓] Updated {name}: {update_fields}")
            else:
                # Might already be set correctly or not found
                print(f" [-] No changes for {name}")

    await client.close()
    print("Sync finished.")

if __name__ == "__main__":
    asyncio.run(sync_data())
