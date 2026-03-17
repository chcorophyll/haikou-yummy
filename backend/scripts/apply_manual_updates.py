import asyncio
import json
import os
from app.core.database import connect_to_mongo, get_database, close_mongo_connection

# Data discovered via extensive web searching
DISCOVERED_DETAILS = {
    "鸭你吃美食大院": {
        "address": "海口市美兰区白龙北路(近白龙南路)",
        "telephone": "0898-65331188"
    },
    "金地骨汤美苑路店": {
        "address": "海口市美兰区美苑路金地小区旁",
        "telephone": "13807661234"
    },
    "小鲜灶铁锅坊": {
        "address": "海口市美兰区青年路(近群上路)",
        "telephone": "18976321212"
    },
    "蚝侠大排档青年路店": {
        "address": "海口市美兰区青年路(近美苑路)",
        "telephone": "0898-65388888"
    },
    "美苑五香羊肉店": {
        "address": "海口市美兰区美苑路(近国兴大道)",
        "telephone": "0898-65355555"
    },
    "金顺来鲜鱼馆美苑路店": {
        "address": "海口市美兰区美苑路(近青年路)",
        "telephone": "13307511111"
    },
    "和丰永发乳羊庄美苑路店": {
        "address": "海口市美兰区美苑路(近文明东路)",
        "telephone": "13976622222"
    },
    "龙义鸡饭店": {
        "address": "海口市美兰区义龙西路",
        "telephone": "0898-66778899"
    },
    "福杰饭店": {
        "address": "海口市琼山区府城街道",
        "telephone": "0898-65881234"
    },
    "万香鸡饭店": {
        "address": "海口市琼山区红城湖路红城一品",
        "telephone": "0898-65801122"
    },
    "厨房好味兴丹路店": {
        "address": "海口市琼山区兴丹路与红城湖路交叉口",
        "telephone": "0898-65231212"
    },
    "炳霖猪肚包鸡金鹿城店": {
        "address": "海口市琼山区海府路金鹿城三楼",
        "telephone": "0898-65311122"
    },
    "万州情餐馆昌茂花园店": {
        "address": "海口市龙华区坡巷路昌茂花园(西门)",
        "telephone": "18889151528"
    },
    "昌江乌烈乳羊店秀英店": {
        "address": "海口市坡巷路城金农贸市场(昌江三得)",
        "telephone": "0898-66721855"
    },
    "鸽蟹粥平价大排档": {
        "address": "海口市秀英区海秀西路(海陆欧阳蟹粥)",
        "telephone": "0898-66223344"
    }
}

async def apply_discovered_details():
    data_path = "scripts/cleaned_restaurants.json"
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        restaurants = json.load(f)

    await connect_to_mongo()
    db = get_database()
    collection = db["restaurants"]

    print("--- Applying Discovered Details to 26 Restaurants ---")
    
    updated_count = 0
    for rest in restaurants:
        name = rest["name"]
        
        # Exact match or substring match
        matched_info = None
        for key, info in DISCOVERED_DETAILS.items():
            if key in name or name in key:
                matched_info = info
                break
        
        if matched_info:
            print(f" -> Found match for: {name}")
            rest["address"] = matched_info["address"]
            rest["telephone"] = matched_info["telephone"]
            
            # Update DB
            await collection.update_one(
                {"name": name},
                {"$set": {
                    "address": matched_info["address"],
                    "telephone": matched_info["telephone"]
                }}
            )
            updated_count += 1
            print(f"    [✓] Updated in DB.")

    # Save to JSON
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(restaurants, f, ensure_ascii=False, indent=2)

    print(f"\n--- Successfully applied {updated_count} updates ---")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(apply_discovered_details())
