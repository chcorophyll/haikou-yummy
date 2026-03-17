# Haikou Yummy - 后端 API 服务 🚀

这是 **海口美食地图 (Haikou Yummy)** 项目的后端部分，采用 FastAPI + MongoDB 构建。

## 🛠️ 技术栈
- **框架**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **数据库**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (云端)
- **异步驱动**: [Motor](https://motor.readthedocs.io/)
- **包管理**: [uv](https://github.com/astral-sh/uv) (极速 Python 包管理器)
- **数据验证**: [Pydantic v2](https://docs.pydantic.dev/)

## 📂 目录结构
```text
backend/
├── app/
│   ├── api/             # API 接口路由
│   ├── core/            # 核心配置与数据库连接
│   ├── models/          # Pydantic 数据模型
│   └── main.py          # 应用入口
├── scripts/             # 数据导入与爬虫脚本
├── tests/               # 自动化测试套件
└── .env                 # 环境变量 (本地开发)
```

## 🚀 快速开始

### 1. 安装环境
确保你已安装了 [uv](https://github.com/astral-sh/uv)。在 `backend` 目录下运行：
```bash
uv sync
```

### 2. 配置环境变量
复制 `.env.example` 并重命名为 `.env`，填入你的 MongoDB 连接字符串和地图 API Key：
```bash
cp .env.example .env
# 编辑 .env 文件
```

### 3. 启动开发服务器
```bash
PYTHONPATH=. uv run uvicorn app.main:app --reload
```
启动后访问：[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) 查看 Swagger 接口文档。

## 🕸️ 数据清洗与补全
1. **基础坐标解析**: `scripts/import_restaurants.py` (腾讯地图 API)。
2. **精细化详情补全**: `scripts/unified_enrichment.py` (主推高德地图 API)。
   - **自动化获取**: 官方地址、联系电话、菜系分类。
   - **门店照片**: 抓取高德 POI 官方实拍图，无图则自动回退至全局默认美图。
*注：当前 26 家餐厅已全部完成高标准的详情补全。数据存储在 MongoDB Atlas 及 `scripts/cleaned_restaurants.json`。*

## 🧪 运行测试
使用 pytest 执行异步接口测试：
```bash
PYTHONPATH=. uv run pytest
```

---
**海口美食地图项目组** 🏝️
