"""
离线生成 Mock 数据 JSON 文件（无需 MongoDB 连接）
无论 MongoDB 是否可用，此脚本都会生成 cleaned_restaurants.json
"""
import json, os, uuid

MOCK_RESTAURANTS = [
    {"name": "鸿运饭店", "district": "美兰区", "address": "海口市美兰区美苑路", "telephone": "", "coordinates": [110.3556, 20.0271], "category": ["海南菜", "家常菜"]},
    {"name": "鸭你吃美食大院", "district": "美兰区", "address": "海口市美兰区", "telephone": "", "coordinates": [110.3579, 20.0285], "category": ["烤鸭", "家常菜"]},
    {"name": "金地骨汤美苑路店", "district": "美兰区", "address": "海口市美兰区美苑路", "telephone": "", "coordinates": [110.3541, 20.0265], "category": ["骨汤", "汤锅"]},
    {"name": "富乐鸡饭店五指山路店", "district": "美兰区", "address": "海口市美兰区五指山路", "telephone": "", "coordinates": [110.3612, 20.0341], "category": ["海南鸡饭", "本地菜"]},
    {"name": "小鲜灶铁锅坊", "district": "美兰区", "address": "海口市美兰区", "telephone": "", "coordinates": [110.3567, 20.0302], "category": ["铁锅炖", "家常菜"]},
    {"name": "潮欣牛肉店南亚店", "district": "美兰区", "address": "海口市美兰区南亚路", "telephone": "", "coordinates": [110.3623, 20.0318], "category": ["牛肉", "潮汕菜"]},
    {"name": "姥佰娘桫椤湾店", "district": "美兰区", "address": "海口市美兰区桫椤湾", "telephone": "", "coordinates": [110.3798, 20.0412], "category": ["海南菜", "家常菜"]},
    {"name": "蚝釜记雅乐里店", "district": "美兰区", "address": "海口市美兰区雅乐里", "telephone": "", "coordinates": [110.3512, 20.0245], "category": ["生蚝", "海鲜"]},
    {"name": "拾惠靓汤燕兴城店", "district": "美兰区", "address": "海口市美兰区燕兴城", "telephone": "", "coordinates": [110.3634, 20.0356], "category": ["靓汤", "滋补汤"]},
    {"name": "蚝侠大排档青年路店", "district": "美兰区", "address": "海口市美兰区青年路", "telephone": "", "coordinates": [110.3548, 20.0278], "category": ["大排档", "生蚝", "海鲜"]},
    {"name": "美苑五香羊肉店", "district": "美兰区", "address": "海口市美兰区美苑路", "telephone": "", "coordinates": [110.3501, 20.0261], "category": ["羊肉", "本地菜"]},
    {"name": "金顺来鲜鱼馆美苑路店", "district": "美兰区", "address": "海口市美兰区美苑路", "telephone": "", "coordinates": [110.3523, 20.0269], "category": ["鱼", "海鲜", "本地菜"]},
    {"name": "和丰永发乳羊庄美苑路店", "district": "美兰区", "address": "海口市美兰区美苑路", "telephone": "", "coordinates": [110.3531, 20.0273], "category": ["乳羊", "烤羊", "本地菜"]},
    {"name": "龙义鸡饭店", "district": "美兰区", "address": "海口市美兰区", "telephone": "", "coordinates": [110.3589, 20.0295], "category": ["海南鸡饭", "本地菜"]},
    {"name": "福杰饭店", "district": "琼山区", "address": "海口市琼山区", "telephone": "", "coordinates": [110.3869, 20.0021], "category": ["家常菜", "本地菜"]},
    {"name": "万香鸡饭店", "district": "琼山区", "address": "海口市琼山区", "telephone": "", "coordinates": [110.3891, 20.0038], "category": ["海南鸡饭", "本地菜"]},
    {"name": "五指山野菜乡兴丹路店", "district": "琼山区", "address": "海口市琼山区兴丹路", "telephone": "", "coordinates": [110.3915, 20.0056], "category": ["野菜", "健康菜", "本地菜"]},
    {"name": "厨房好味兴丹路店", "district": "琼山区", "address": "海口市琼山区兴丹路", "telephone": "", "coordinates": [110.3923, 20.0061], "category": ["家常菜", "本地菜"]},
    {"name": "炳霖猪肚包鸡金鹿城店", "district": "琼山区", "address": "海口市琼山区金鹿城", "telephone": "", "coordinates": [110.3945, 20.0078], "category": ["猪肚鸡", "汤锅", "本地菜"]},
    {"name": "琼菜之家金鹿城店", "district": "琼山区", "address": "海口市琼山区金鹿城", "telephone": "", "coordinates": [110.3956, 20.0084], "category": ["琼菜", "海南菜", "本地菜"]},
    {"name": "大水车公馆", "district": "龙华区", "address": "海口市龙华区", "telephone": "", "coordinates": [110.3156, 20.0441], "category": ["家常菜", "本地菜"]},
    {"name": "万州情餐馆昌茂花园店", "district": "龙华区", "address": "海口市龙华区昌茂花园", "telephone": "", "coordinates": [110.3234, 20.0489], "category": ["重庆菜", "万州菜"]},
    {"name": "石山乳羊第一家", "district": "龙华区", "address": "海口市龙华区石山镇", "telephone": "", "coordinates": [110.2789, 20.0123], "category": ["乳羊", "烤羊", "石山菜"]},
    {"name": "文昌阿德猪脚饭", "district": "秀英区", "address": "海口市秀英区", "telephone": "", "coordinates": [110.2856, 20.0512], "category": ["猪脚饭", "文昌菜"]},
    {"name": "昌江乌烈乳羊店秀英店", "district": "秀英区", "address": "海口市秀英区", "telephone": "", "coordinates": [110.2923, 20.0478], "category": ["乳羊", "昌江菜"]},
    {"name": "鸽蟹粥平价大排档", "district": "秀英区", "address": "海口市秀英区", "telephone": "", "coordinates": [110.2901, 20.0467], "category": ["海鲜粥", "螃蟹", "大排档"]},
]

def to_doc(raw):
    return {
        "_id": str(uuid.uuid4()),
        "name": raw["name"],
        "category": raw["category"],
        "location": {"type": "Point", "coordinates": raw["coordinates"]},
        "address": raw["address"],
        "district": raw["district"],
        "source": "manual",
        "is_verified": True,
        "created_at": None,
        "updated_at": None,
    }

records = [to_doc(r) for r in MOCK_RESTAURANTS]

script_dir = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(script_dir, "cleaned_restaurants.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f"✅ 生成了 {len(records)} 条 Mock 数据")
print(f"📁 已保存至: {out}")
