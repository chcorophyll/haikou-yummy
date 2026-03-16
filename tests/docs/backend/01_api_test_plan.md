# 后端第一阶段 API 测试计划 (Test Plan)

## 1. 概述
本文档规定了 `Haikou Yummy` 后端 API 第一阶段 (MVP) 相关的测试策略、测试范围及特定的测试用例。测试代码应放置在 `tests/` 目录下，并使用 `pytest` 和 `httpx` (支持 FastAPI 异步测试) 进行验证。

## 2. 测试策略与环境
- **测试框架**: `pytest`
- **HTTP 客户端**: 使用 FastAPI 提供的 `TestClient` (基于 `httpx`)
- **测试数据库**:
  在自动化测试环节，应尽量避免连接生产环境的 MongoDB Atlas 集群。
  策略一：使用专门的测试 MongoDB 实例 (或者本机的 MongoDB)。
  策略二：如果仅做 API 行为验证，可以通过 Mock (`unittest.mock` 或 `pytest-mock`) 屏蔽掉实际的数据库交互。
  *(建议初期使用策略一本地数据库 `mongodb://localhost:27017` 进行真实读写测试以验证索引和空间查询逻辑)*

## 3. 测试用例范围

### 3.1. 环境健康检查 (Sanity Check)
- **用例**: 请求根目录 `GET /`
- **预期**: 返回状态码 200，以及带项目名称的欢迎 JSON 信息。

### 3.2. 餐厅创建接口 (POST `/api/v1/restaurants/`)
- **正向用例**: 提交包含合法 `name`和符合 `GeoJSON` 的 `location` 的数据。预期 201 状态码，返回包含了 `_id` 字段的对象。
- **负向用例 1 (缺失字段)**: 不提交必需的 `location` 或 `name`。预期 422 Unprocessable Entity 数据校验报错。
- **负向用例 2 (越界处理)**: 经纬度越界（如超过 180/-180）或者评分超过 5.0。预期 422。

### 3.3. 获取餐厅列表 (GET `/api/v1/restaurants/`)
- **正向用例**: 请求接口带有或不带有分页参数。预期 200。返回列表及数据量符合分页设定。

### 3.4. 空间查询附近餐厅 (GET `/api/v1/restaurants/nearby/`)
- **正向用例**: 给定经度 `110.3340` 和纬度 `20.0384` (海口)，预设 5 km 半径。预期能够成功返回测试数据中在此范围内的餐厅，而超出范围的餐厅不出现。
- **负向用例**: 缺失经纬度参数。预期 422 报错。

### 3.5. 获取餐厅详情 (GET `/api/v1/restaurants/{id}`)
- **正向用例**: 传入存在的正确的 MongoDB ObjectId。预期 200，数据一致。
- **负向用例 1**: 传入不存在但合法的 ObjectId。预期 404 (Not Found)。
- **负向用例 2**: 传入明显不合法的随机字符串做为 ID。预期 400 (Bad Request)。

## 4. 运行执行规范
测试将在每次 Push 到 GitHub 时通过 CI (如 GitHub Actions) 执行。同时开发人员可以在本地通过执行 `cd backend && uv run pytest` 单独执行测试套件以验证修改。
