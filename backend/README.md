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

## 🕸️ 数据清洗与抓取
1. **基础导入**: 将原始文本放入 `scripts/raw_data.txt`，运行：
   ```bash
   PYTHONPATH=. uv run scripts/import_restaurants.py
   ```
2. **详情补全 (大众点评/人肉搜索模式)**:
   如果您需要补全地址和电话，可以执行：
   ```bash
   # 已集成多源搜索后的补全脚本
   PYTHONPATH=. uv run scripts/apply_manual_updates.py
   ```
*注：该流程已完成对 26 家初始餐厅的详情补全，详细数据见 `scripts/cleaned_restaurants.json`。*

## 🧪 运行测试
使用 pytest 执行异步接口测试：
```bash
PYTHONPATH=. uv run pytest
```

---
**海口美食地图项目组** 🏝️
