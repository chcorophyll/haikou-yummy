"""
手工 Mock 数据导入脚本
使用已知海口市各区的近似坐标，为 26 家餐厅生成标准格式数据，导入 MongoDB 并保存 JSON 文件。
等腾讯地图 API 额度恢复后，可用真实数据重新覆盖。
"""
import asyncio
import json
import os
import uuid

from app.core.database import connect_to_mongo, get_database, close_mongo_connection
from app.models.restaurant import RestaurantCreate, GeoJSONPoint

# ============================================================
# Mock 数据：使用海口市各区的近似真实坐标
# 坐标来源：Google Maps 人工查询参考
# ============================================================
MOCK_RESTAURANTS = [
    # --- 美兰区 ---
    {
        "name": "鸿运饭店",
        "district": "美兰区",
        "address": "海口市美兰区美苑路",
        "telephone": "",
        "coordinates": [110.3556, 20.0271],
        "category": ["海南菜", "家常菜"],
    },
    {
        "name": "鸭你吃美食大院",
        "district": "美兰区",
        "address": "海口市美兰区",
        "telephone": "",
        "coordinates": [110.3579, 20.0285],
        "category": ["烤鸭", "家常菜"],
    },
    {
        "name": "金地骨汤美苑路店",
        "district": "美兰区",
        "address": "海口市美兰区美苑路",
        "telephone": "",
        "coordinates": [110.3541, 20.0265],
        "category": ["骨汤", "汤锅"],
    },
    {
        "name": "富乐鸡饭店五指山路店",
        "district": "美兰区",
        "address": "海口市美兰区五指山路",
        "telephone": "",
        "coordinates": [110.3612, 20.0341],
        "category": ["海南鸡饭", "本地菜"],
    },
    {
        "name": "小鲜灶铁锅坊",
        "district": "美兰区",
        "address": "海口市美兰区",
        "telephone": "",
        "coordinates": [110.3567, 20.0302],
        "category": ["铁锅炖", "家常菜"],
    },
    {
        "name": "潮欣牛肉店南亚店",
        "district": "美兰区",
        "address": "海口市美兰区南亚路",
        "telephone": "",
        "coordinates": [110.3623, 20.0318],
        "category": ["牛肉", "潮汕菜"],
    },
    {
        "name": "姥佰娘桫椤湾店",
        "district": "美兰区",
        "address": "海口市美兰区桫椤湾",
        "telephone": "",
        "coordinates": [110.3798, 20.0412],
        "category": ["海南菜", "家常菜"],
    },
    {
        "name": "蚝釜记雅乐里店",
        "district": "美兰区",
        "address": "海口市美兰区雅乐里",
        "telephone": "",
        "coordinates": [110.3512, 20.0245],
        "category": ["生蚝", "海鲜"],
    },
    {
        "name": "拾惠靓汤燕兴城店",
        "district": "美兰区",
        "address": "海口市美兰区燕兴城",
        "telephone": "",
        "coordinates": [110.3634, 20.0356],
        "category": ["靓汤", "滋补汤"],
    },
    {
        "name": "蚝侠大排档青年路店",
        "district": "美兰区",
        "address": "海口市美兰区青年路",
        "telephone": "",
        "coordinates": [110.3548, 20.0278],
        "category": ["大排档", "生蚝", "海鲜"],
    },
    {
        "name": "美苑五香羊肉店",
        "district": "美兰区",
        "address": "海口市美兰区美苑路",
        "telephone": "",
        "coordinates": [110.3501, 20.0261],
        "category": ["羊肉", "本地菜"],
    },
    {
        "name": "金顺来鲜鱼馆美苑路店",
        "district": "美兰区",
        "address": "海口市美兰区美苑路",
        "telephone": "",
        "coordinates": [110.3523, 20.0269],
        "category": ["鱼", "海鲜", "本地菜"],
    },
    {
        "name": "和丰永发乳羊庄美苑路店",
        "district": "美兰区",
        "address": "海口市美兰区美苑路",
        "telephone": "",
        "coordinates": [110.3531, 20.0273],
        "category": ["乳羊", "烤羊", "本地菜"],
    },
    {
        "name": "龙义鸡饭店",
        "district": "美兰区",
        "address": "海口市美兰区",
        "telephone": "",
        "coordinates": [110.3589, 20.0295],
        "category": ["海南鸡饭", "本地菜"],
    },
    # --- 琼山区 ---
    {
        "name": "福杰饭店",
        "district": "琼山区",
        "address": "海口市琼山区",
        "telephone": "",
        "coordinates": [110.3869, 20.0021],
        "category": ["家常菜", "本地菜"],
    },
    {
        "name": "万香鸡饭店",
        "district": "琼山区",
        "address": "海口市琼山区",
        "telephone": "",
        "coordinates": [110.3891, 20.0038],
        "category": ["海南鸡饭", "本地菜"],
    },
    {
        "name": "五指山野菜乡兴丹路店",
        "district": "琼山区",
        "address": "海口市琼山区兴丹路",
        "telephone": "",
        "coordinates": [110.3915, 20.0056],
        "category": ["野菜", "健康菜", "本地菜"],
    },
    {
        "name": "厨房好味兴丹路店",
        "district": "琼山区",
        "address": "海口市琼山区兴丹路",
        "telephone": "",
        "coordinates": [110.3923, 20.0061],
        "category": ["家常菜", "本地菜"],
    },
    {
        "name": "炳霖猪肚包鸡金鹿城店",
        "district": "琼山区",
        "address": "海口市琼山区金鹿城",
        "telephone": "",
        "coordinates": [110.3945, 20.0078],
        "category": ["猪肚鸡", "汤锅", "本地菜"],
    },
    {
        "name": "琼菜之家金鹿城店",
        "district": "琼山区",
        "address": "海口市琼山区金鹿城",
        "telephone": "",
        "coordinates": [110.3956, 20.0084],
        "category": ["琼菜", "海南菜", "本地菜"],
    },
    # --- 龙华区 ---
    {
        "name": "大水车公馆",
        "district": "龙华区",
        "address": "海口市龙华区",
        "telephone": "",
        "coordinates": [110.3156, 20.0441],
        "category": ["家常菜", "本地菜"],
    },
    {
        "name": "万州情餐馆昌茂花园店",
        "district": "龙华区",
        "address": "海口市龙华区昌茂花园",
        "telephone": "",
        "coordinates": [110.3234, 20.0489],
        "category": ["重庆菜", "万州菜"],
    },
    {
        "name": "石山乳羊第一家",
        "district": "龙华区",
        "address": "海口市龙华区石山镇",
        "telephone": "",
        "coordinates": [110.2789, 20.0123],
        "category": ["乳羊", "烤羊", "石山菜"],
    },
    # --- 秀英区 ---
    {
        "name": "文昌阿德猪脚饭",
        "district": "秀英区",
        "address": "海口市秀英区",
        "telephone": "",
        "coordinates": [110.2856, 20.0512],
        "category": ["猪脚饭", "文昌菜"],
    },
    {
        "name": "昌江乌烈乳羊店秀英店",
        "district": "秀英区",
        "address": "海口市秀英区",
        "telephone": "",
        "coordinates": [110.2923, 20.0478],
        "category": ["乳羊", "昌江菜"],
    },
    {
        "name": "鸽蟹粥平价大排档",
        "district": "秀英区",
        "address": "海口市秀英区",
        "telephone": "",
        "coordinates": [110.2901, 20.0467],
        "category": ["海鲜粥", "螃蟹", "大排档"],
    },
]


async def insert_mock_data():
    """Insert mock restaurant data into MongoDB and export to JSON file."""
    mongodb_available = False
    collection = None
    
    try:
        await connect_to_mongo()
        db = get_database()
        collection = db["restaurants"]
        mongodb_available = True
        print("[✓] MongoDB 连接成功！")
    except Exception as e:
        print(f"[!] MongoDB 连接失败: {e}")
        print("[!] 将只生成 JSON 文件。")
    
    print(f"\n--- 开始插入 {len(MOCK_RESTAURANTS)} 条 Mock 数据 ---")
    collected_data = []
    inserted_count = 0
    skipped_count = 0

    for raw in MOCK_RESTAURANTS:
        print(f" -> [ {raw['district']} ] {raw['name']}")

        # Check for duplicates in DB
        if mongodb_available:
            existing = await collection.find_one({"name": raw["name"]})
            if existing:
                print(f"    [✓] 已在数据库中存在，跳过。")
                existing["_id"] = str(existing["_id"])
                collected_data.append(existing)
                skipped_count += 1
                continue

        restaurant = RestaurantCreate(
            name=raw["name"],
            category=raw["category"],
            location=GeoJSONPoint(coordinates=raw["coordinates"]),
            address=raw["address"],
            source="manual",
            is_verified=True
        )

        doc = restaurant.model_dump()
        if raw.get("telephone"):
            doc["telephone"] = raw["telephone"]
        doc["district"] = raw["district"]

        if mongodb_available:
            result = await collection.insert_one(doc)
            doc["_id"] = str(result.inserted_id)
            print(f"    [+] 已写入数据库。")
        else:
            doc["_id"] = str(uuid.uuid4())
            print(f"    [+] 已生成（仅 JSON 模式）。")

        collected_data.append(doc)
        inserted_count += 1

    # Export JSON
    script_dir = os.path.dirname(os.path.abspath(__file__))
    export_path = os.path.join(script_dir, "cleaned_restaurants.json")
    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(collected_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"✅ 完成！共插入 {inserted_count} 条，跳过 {skipped_count} 条（已存在）。")
    print(f"📁 JSON 文件已保存至: {export_path}")
    print(f"{'='*50}")

    if mongodb_available:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(insert_mock_data())
