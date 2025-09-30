# 广东城际列车数据获取工具

这是一个自动获取广东城际列车数据的工具，通过 GitHub Actions 每日自动更新数据并发布到 GitHub Pages。

## 🚀 功能特点

-   **自动化数据获取**: 每日北京时间凌晨 4 点自动运行
-   **智能缓存**: 已获取的数据会被缓存，避免重复请求
-   **多日期支持**: 同时获取当日及未来 3 天的数据
-   **GitHub Pages 发布**: 自动将数据发布到 GitHub Pages，提供 API 访问
-   **错误处理**: 完善的错误处理和执行报告

## 📊 数据结构

### 输出文件

每个日期的数据会保存在 `data/YYYYMMDD/` 目录下，包含以下文件：

-   `trains.json`: 列车信息对象格式
-   `stations.json`: 站点信息对象格式
-   `trains.map.json`: 列车信息数组格式
-   `stations.map.json`: 站点信息数组格式

### API 访问

部署到 GitHub Pages 后，可以通过以下 URL 访问数据：

```
https://guangdong-intercity-data.bobliu.tech/YYYYMMDD/trains.json
https://guangdong-intercity-data.bobliu.tech/YYYYMMDD/stations.json
```

## 🛠 本地使用

### 获取单日数据

```bash
# 获取今日数据
deno run --allow-net --allow-read --allow-write index.ts

# 获取指定日期数据
deno run --allow-net --allow-read --allow-write index.ts 2025-09-30
```

### 获取多日数据

```bash
# 获取未来4天数据
deno run --allow-net --allow-read --allow-write fetch.ts
```

## 📁 项目结构

```
├── .github/
│   └── workflows/
│       └── fetch-and-deploy.yml    # GitHub Actions工作流
├── data/                           # 数据输出目录
│   ├── YYYYMMDD/                  # 各日期数据
│   └── log.json # 执行摘要
├── index.ts                        # 核心数据获取逻辑
├── fetch.ts                        # 多日期数据获取脚本
├── types.ts                        # TypeScript类型定义
├── deno.json                       # Deno配置
└── README.md                       # 本文件
```

## 📝 数据来源

-   **站点信息**: 铁路 12306（站点电报码）、广州地铁 API（广东城际站点）
-   **列车数据**: 铁旅（车站列车信息）、铁路 12306（列车经停信息）
