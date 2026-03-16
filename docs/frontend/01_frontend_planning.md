# 网页前端 MVP 开发计划

本文档为基于 `haikou_yummy_development_plan.md` 的 Web 前端 MVP（Minimum Viable Product）阶段的具体开发规划。

## 1. 核心技术栈

- **框架**: React + Vite (采用 TypeScript)
- **样式**: Tailwind CSS (用于快速构建高颜值的响应式界面)
- **状态管理**: React Context + Hooks (满足 MVP 阶段需求) / Zustand (备选)
- **地图服务**: 高德地图 (AMAP) JS API / `react-amap` 组件库
- **网络请求**: Axios 或原生 Fetch 封装
- **测试框架**: Vitest + React Testing Library (实现标准开发验证测试流程)
- **代码规范**: ESLint + Prettier + Husky (规范提交)

## 2. 界面布局与导航

### 页面结构
作为地图应用，MVP 阶段建议使用单页面应用 (SPA) 全屏布局：
- **全屏地图层**: 占满整个屏幕背景或左侧 (PC端)，展示海口地图底图及所有店铺的点位 (Markers)。
- **操作面板 (Sidebar / Bottom Sheet)**:
  - **PC端**: 位于界面左侧或右侧的悬浮状态栏 / 固定侧边栏。
  - **移动端**: 居于底部的抽屉式可上拉面板，方便单手操作。
- **全局搜索框**: 提供对店铺名称、分类、地址的快捷检索。

### 核心组件划分
- `App.tsx`: 根组件，全局状态 Provider 包裹。
- `MapContainer.tsx`: 承载高德地图实例，处理点位渲染、点击交互及缩放联动。
- `Sidebar.tsx`: 容纳搜索栏、店铺列表和详情卡片。
- `ShopCard.tsx`: 单条商铺摘要列表项组件。
- `ShopDetail.tsx`: 点击商铺卡片或地图图标后呈现的详细信息面。

## 3. 标准开发与测试流程 (TDD/BDD)

1. **环境初始化**:
   部署 Vite React 模板，添加 Tailwind 依赖配置，初始化 Git 仓库。
2. **基础组件与测试先行**:
   基于 Vitest 创建 `utils` 方法的单元测试。利用 React Testing Library 编写基础展示组件 (如 `ShopCard`) 的渲染测试。
3. **集成地图引擎**:
   引入地图 API，处理地图生命周期，添加临时 Mock 数据测试点位渲染逻辑。
4. **服务对接**:
   对接后端 FastAPI 接口 (可使用 Axios mock Adapter 临时模拟)。
5. **部署与验证**:
   在本地或 CI (如 GitHub Actions) 跑通 lint 和 test，确保符合高质量交付标准。

## 4. GitHub 代码管理策略

- 采用 **Feature Branch** 工作流。
- 所有的特性开发（如 `feature/map-integration`，`feature/shop-list`）均从 `main` 或 `develop` 检出。
- 遵守 **Conventional Commits** 提交规范，如 `feat: add map base component` 或 `test: add unit tests for api caller`。
- 配置 `.gitignore` 忽略 `.env.local` 敏感信息、`node_modules` 依赖以及打包产物。
