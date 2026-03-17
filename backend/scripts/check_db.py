import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()
MONGODB_URL = os.environ.get("MONGODB_URL")

async def check():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client["haikou_yummy"]
    doc = await db.restaurants.find_one({"name": "鸿运饭店"})
    print("Document for 鸿运饭店:")
    print(doc)
    await client.close()

if __name__ == "__main__":
    asyncio.run(check())
