# 第二阶段：数据清洗与高德地图信息抓取 (Crawler & Data Cleaning) 🕷️

## 目标描述
用户手动提供了一批不完整的海口基础餐厅数据（主要包含：辖区、名称、部分地址）。为了满足 MongoDB `restaurants` 集合所需的数据模型（特别是必须的 `location` GeoJSON 经纬度数据，以及详细地址、电话等），我们需要开发一个 Python 脚本工具。
该脚本将负责清理文本数据，并通过调用公网地图 API（首选高德地图或腾讯地图开放平台的 Web 服务 API）来进行 POI（兴趣点）搜索，自动补全缺失信息，最后将整理好的规范数据批量导入 MongoDB Atlas 数据库中。

## 需要用户审核的事项
> [!IMPORTANT]
> 1.  **地图 API Key 申请**：使用爬虫调用公开 API 需要提供开发者的 Key。请问您是否有注册过高德地图开放平台 (amap) 或腾讯地图的开发者账号？如果没有，可能需要您花 2 分钟去免费申请一个 Web 服务的 API Key。
> 2.  **数据去重策略**：当二次运行脚本导入相同的店铺时，我们预期使用 “餐厅名 + 经纬度位置” 作为唯一索引防止重复插入。

## 提议的更改

### 1. 独立脚本工具结构
在项目中新建一个 `scripts/` 目录存放专门用于辅助开发的脚本程序：
```
backend/
├── scripts/
│   ├── raw_data.txt      # 存放你发给我的原始多行文本数据
│   └── import_restaurants.py # 核心执行脚本：拉取API、清洗、插库
```

### 2. 脚本流程逻辑 (import_restaurants.py)
**依赖扩展**：使用 `httpx` (已安装) 发起异步 HTTP 请求，使用 `asyncio` 限制并发，并复用已有的 `app.core.database` 和 `app.models.restaurant` 模型进行严格的数据校验。

**处理流**：
1.  **解析读取**：逐行读取 `raw_data.txt`，用正则表达式或 `split` 切分提取【辖区】和【店名】。
2.  **地图 API 抓取**：构造请求访问高德开放平台 POI 搜索 API `https://restapi.amap.com/v3/place/text?keywords={店名}&city=海口市&key={API_KEY}`
3.  **数据映射清洗**：
    *   将返回的字符串经纬度解析为 Float。
    *   构建符合验证要求的 `location` (GeoJSON)。
    *   提取返回结果中的标准 `address` (详细地址)、`tel` (电话)、`rating` (综合评分) 等信息。
4.  **组装与验证**：生成 `RestaurantCreate` 字典，让 Pydantic 把把关。
5.  **批量落库**：使用 Motor 客户端的 `insert_many` 或是逐条 `upsert` (更新或插入) 保存到 `haikou_yummy` 的 `restaurants` 数据库中。

## 验证计划
- 编写 `tests/docs/backend/02_crawler_test_plan.md` 进行专门针对数据清洗工具的验证逻辑测试，保障爬虫对于“搜不到店名”甚至“API 发生错误返回”这类异常边的鲁棒性处理。
- 最终手动检查 MongoDB Atlas UI，确认这一批店面上齐，且包含正确的坐标点。
