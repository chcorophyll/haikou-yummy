# 后端第一阶段 MVP 架构设计文档

## 1. 概述
本文档描述了海口美食地图 (Haikou Yummy) 项目后端的 MVP (最小可行性产品) 阶段的设计与规划。后端采用 Python 的 FastAPI 框架构建，并使用 MongoDB Atlas 作为云数据库。

## 2. 目录结构设计
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 应用程序入口
│   ├── core/            # 核心配置文件夹
│   │   ├── config.py    # 基于 Pydantic 的环境变量配置
│   │   └── database.py  # MongoDB 连接单例与生命周期回调
│   ├── models/          # 实体与数据传输对象 (DTOs)
│   │   └── restaurant.py# Restaurant 的 Pydantic 数据验证模型
│   └── api/             # 路由与控制器层
│       ├── __init__.py
│       └── endpoints/
│           ├── __init__.py
│           └── restaurants.py # Restaurant 相关的 CRUD 接口
├── pyproject.toml       # uv 环境配置与依赖列表
├── uv.lock              # uv 依赖绑定文件
└── .env                 # 环境变量 (切勿提交)
```

## 3. 核心数据模型 (MongoDB & Pydantic)
- **集合名称**: `restaurants`
- **主要字段**:
  - `_id`: 内部生成的 ObjectId
  - `name` (String): 餐厅名称
  - `category` (Array[String]): 分类标签
  - `location` (GeoJSON Point): 地理坐标 `[经度, 纬度]`
  - `address` (String): 详细地址
  - `price_per_person` (Float): 人均消费
  - `opening_hours` (String): 营业时间
  - `rating` (Float): 评分 (0-5)
  - `is_verified` (Boolean): 审核状态

## 4. API 接口设计 (v1)

### 4.1. 创建餐厅
- **URL**: `POST /api/v1/restaurants/`
- **请求体**: `RestaurantCreate` 模型，包含经纬度等必须信息
- **响应**: 返回创建成功的 `RestaurantInDB` 对象，包括分配的 `_id`
- **用途**: MVP 阶段用于填充数据。

### 4.2. 获取餐厅列表
- **URL**: `GET /api/v1/restaurants/`
- **Query参数**: `skip` (默认0), `limit` (默认100)
- **响应**: 返回 `RestaurantInDB` 对象列表

### 4.3. 附近餐厅搜索 (空间查询)
- **URL**: `GET /api/v1/restaurants/nearby/`
- **Query参数**: `longitude` (必须), `latitude` (必须), `max_distance` (默认5000米)
- **响应**: 返回 `RestaurantInDB` 对象列表，按照与输入的 GeoJSON 坐标点的距离升序排列。
- **技术点**: 依赖 MongoDB 的 `$near` 查询操作符，前提是 `location` 必须建立 `2dsphere` 索引。

### 4.4. 获取单个餐厅详情
- **URL**: `GET /api/v1/restaurants/{restaurant_id}`
- **Path参数**: `restaurant_id` (ObjectId 格式)
- **响应**: 成功返回 `RestaurantInDB`，如果不存在则返回 404 HTTP 报错。
