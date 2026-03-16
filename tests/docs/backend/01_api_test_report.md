# 后端第一阶段 API 测试报告 (Test Report)

## 1. 测试概览
- **测试时间**: 系统初次测试由于缺少对应的环境未能完整通过。
- **关联计划**: `tests/docs/backend/01_api_test_plan.md`
- **当前状态**: ⚠️ **阻塞 (Blocked)**
- **阻塞原因**: `pymongo.errors.ServerSelectionTimeoutError: localhost:27017: [Errno 61] Connection refused` 
后端在测试时依赖并连接本地默认的 MongoDB 端口 `27017`，但当前机器并未启动本服务。导致所有的请求都卡死并在超时后失败断开。

## 2. 修复建议与后续步骤
- **选项 A**: 请在本地开启运行中的 MongoDB。测试数据将会隔离在 `test_haikou_yummy` 库之中，不会影响主库。
- **选项 B**: 请在项目中配置线上的 `MongoDB Atlas` 集群。并在运行指令前携带 URI 环境变量执行如：
```bash
MONGODB_URL="mongodb+srv://<你的账号密码>@cluster0.xxxxx.mongodb.net" uv run pytest -v
```

## 3. 代码修正
在尝试运行测试的过程中，提前捕获并修复了两处依赖库过时的弃用警告 (Deprecation Warnings)：
1. **Pydantic V2**: 修正了 `RestaurantInDB` 中早已被淘汰弃用的 `class Config:` 设置方法，更新为了最新的 `model_config = ConfigDict(...)` 支持。
2. **FastAPI Lifespan**: 废除了过时的 `@app.on_event("startup")` 回调钩子，使用了官方目前推荐的 `@asynccontextmanager def lifespan` 的上下文依赖方式包裹数据库的生命周期连接操作。
