# 海口美食地图 — 微信小程序开发计划 📱

> **目标：** 以现有 Web 版本（React + Tailwind + 高德地图）的功能与视觉风格为基准，使用 **UniApp + Vue 3** 构建一套功能对等、体验优先的微信小程序端。

---

## 📐 技术栈选型

| 层级 | 技术 | 说明 |
|---|---|---|
| 框架 | UniApp (Vue 3 + Composition API) | 一套代码，编译微信小程序 |
| 状态管理 | Pinia | 轻量替代 Vuex |
| 样式 | UnoCSS (原子CSS) | 等同 Web 端 Tailwind 的开发体验 |
| 地图 | 腾讯地图微信小程序 SDK (`map` 组件) | 微信小程序原生 map 组件 + overlay |
| 数据接口 | 与 Web 共用同一套 FastAPI 后端 | 无需修改后端 |
| 本地存储 | `wx.setStorageSync` | 对标 Web 端 localStorage 收藏夹 |
| 导航 | 调用 `wx.openLocation` 或腾讯地图路线规划 | 对标 Web 端高德 AMap Driving |

---

## 🎨 视觉风格对齐策略

Web 端的"Tesla 暗黑"设计语言将 **1:1 还原**到小程序。具体映射如下：

| Web（Tailwind 变量） | 小程序色值 | 用途 |
|---|---|---|
| `tesla-dark` #111 | `#111111` | 全局背景 |
| `tesla-black` #0a0a0a | `#0a0a0a` | 侧栏/卡片背景 |
| `tesla-red` #e31937 | `#e31937` | 主题色/强调/选中 |
| `tesla-gray` #2a2a2a | `#2a2a2a` | 边框/次要背景 |
| `tesla-muted` #666 | `#666666` | 辅助文字 |
| `tesla-light` #ccc | `#cccccc` | 正文文字 |

字体：使用 PingFang SC 作为系统字体，标题 `tracking-widest` 对应 `letter-spacing: 4rpx`。

---

## 🗂️ 页面结构规划

```
pages/
├── index/          地图主页（全屏地图 + 底部抽屉）
├── list/           餐厅列表页（同 Web Sidebar，独立 Tab）
├── detail/         餐厅详情页（从列表或地图标注跳入）
├── favorites/      我的收藏（同 Web Saved Tab）
└── submit/         推荐宝藏店（同 Web + 按钮的表单弹窗）

components/
├── RestaurantCard/ 横向卡片（图片 + 名称 + 地址 + 电话 + 收藏）
├── MapMarker/      自定义地图标注覆盖层（Tesla 红点风格）
├── SearchBar/      搜索栏 + 下拉建议 + 快捷标签
├── NavBar/         自定义顶部导航（统一黑色背景）
├── BottomSheet/    底部抽屉（餐厅信息面板，替代 Web 信息窗口）
└── Toast/          轻提示组件（对标 Web 自定义 Toast）
```

---

## ✅ 核心功能清单（对标 Web 版）

### 1. 🗺️ 地图主页 (`index`)
- **全屏腾讯地图**，深色暗黑地图底图（腾讯地图暗色方案）
- **餐厅自定义标注**：Tesla 红点样式，选中状态放大 + 光晕动效（Web 已实现）
- **当前定位蓝点**：调用 `wx.getLocation` 获取用户位置，渲染为蓝色闪烁圆圈
- **悬浮搜索栏**：固定于地图顶部，输入时展示下拉搜索建议（名称高亮匹配）
- **快捷菜系标签**：`All` + 动态 Top 3 菜系，点击筛选标注
- **点击标注** ➜ 底部抽屉弹出（`BottomSheet`），展示餐厅名、地址、电话
- **发现餐厅数量** 统计展示
- **"推荐宝藏店" FAB**：右下角浮动按钮，点击跳转 `submit` 页面

### 2. 📋 餐厅列表页 (`list`)
- 竖向列表，同 Web Sidebar 的 `RestaurantCard` 布局
- 支持按名称/地址/菜系实时搜索（防抖 300ms）
- 收藏心形按钮，点击切换收藏状态（Pinia 持久化至 Storage）
- 点击卡片 ➜ 跳转 `detail` 详情页或联动地图标注

### 3. 📍 餐厅详情页 (`detail`)
- 顶部大图轮播（`images` 数组）
- 餐厅名（Tesla 红色强调）、菜系标签、电话（一键拨打）、地址（一键复制）
- **导航按钮**：调用 `wx.openLocation` 打开原生微信地图导航（对标 Web AMap Driving）
- 收藏/取消收藏

### 4. ❤️ 我的收藏页 (`favorites`)
- 同 Web 端 Saved Tab，展示所有已收藏餐厅卡片
- 支持一键清空（确认弹窗）
- 空状态插画（Tesla 暗黑风格）

### 5. ➕ 推荐宝藏店 (`submit`)
- 对标 Web `RestaurantSubmission` 组件
- 餐厅名称、地址、联系方式、推荐理由文本域
- 提交后 POST 到后端 `/restaurants`（`is_verified: false`）
- 成功提示 Toast（审核中状态说明）

---

## 🔌 与后端 API 的对接

与 Web 端共用同一 FastAPI 后端，无需新增接口：

| 功能 | API 端点 |
|---|---|
| 获取全部餐厅列表 | `GET /restaurants` |
| 获取附近餐厅 | `GET /restaurants/nearby?lng=&lat=&radius=` |
| 获取单个餐厅详情 | `GET /restaurants/{id}` |
| 提交新店 | `POST /restaurants` |

> [!NOTE]
> 小程序需在微信公众平台配置合法域名白名单，需将后端 API 域名加入 `request` 合法域名。

---

## 🚧 平台特殊适配说明

| 事项 | Web 方案 | 小程序方案 |
|---|---|---|
| 地图组件 | AMap JS API | 腾讯地图原生 `<map>` 组件 |
| 信息窗口 | AMap InfoWindow | 底部 BottomSheet 抽屉（z-index 覆盖地图） |
| 导航 | AMap Driving 路线绘制 | `wx.openLocation` 唤起原生地图 |
| 定位 | AMap Geolocation | `wx.getLocation`（需 scope 授权） |
| 本地收藏 | `localStorage` | `wx.setStorageSync` + Pinia 持久化 |
| 样式动效 | CSS keyframes + Tailwind | WXSS animation + UnoCSS |
| 搜索体验 | 浮动搜索条 + Dropdown | 顶部搜索栏 + 结果浮层 |

---

## 📅 开发阶段计划

### Phase 1：基础框架搭建（约 1 周）
- [ ] 初始化 UniApp + Vue 3 项目，接入 UnoCSS
- [ ] 搭建全局设计系统（颜色变量、通用 CSS）
- [ ] 实现 `NavBar`、`RestaurantCard`、`Toast` 等基础组件
- [ ] 配置后端 API 请求层（封装 `wx.request`）

### Phase 2：地图与核心功能（约 1.5 周）
- [ ] 实现地图主页：腾讯地图集成、自定义标注、定位蓝点
- [ ] 实现搜索栏 + 快捷菜系标签筛选
- [ ] 实现 `BottomSheet` 弹窗展示餐厅信息
- [ ] 实现餐厅列表页与详情页

### Phase 3：社交与体验打磨（约 1 周）
- [ ] 实现收藏功能（Pinia + wx.Storage 持久化）
- [ ] 实现"推荐宝藏店"提交表单
- [ ] 全量 UI 打磨：动效、暗色适配、边缘情况处理
- [ ] 微信开放平台配置、真机测试与验证

---

## ✅ 验证计划

### 功能验收
- 在微信开发者工具（模拟器 + Android 真机）中逐一核验功能清单中的每一项
- 对标 Web 版截图进行视觉 Diff，确保设计风格一致

### 接口联调
- 启动本地 FastAPI 后端（`PYTHONPATH=. uv run uvicorn app.main:app --reload`）
- 在小程序开发者工具中关闭域名校验，验证所有 API 调用正常返回

### 性能
- 首屏加载时间 < 2s（真机）
- 地图标注渲染无明显卡顿（26 个标注点）
