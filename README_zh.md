# OpsKitPro (Ops + Kit + Professional) — AI 原生运维基础设施

[English](./README.md) | [简体中文](./README_zh.md)

**OpsKitPro** 是一个极简、硬核且高度自动化的运维基础设施，专为下一代 AI 原生工程师构建。该项目从资深 SRE 的视角设计，体现去中心化、代码定义（Infrastructure as Code）的核心理念。

> [!IMPORTANT]
> 本项目运行在 **Cloudflare Workers** 上，通过 [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) 适配器部署。Worker 入口仅 ~2 KB，服务端逻辑和静态资源从边缘按需加载。

---

## 🚀 核心特性

- **⚡ 边缘优先架构** — 基于 **Next.js 16 (Turbopack)** + **Cloudflare Workers**，绕过传统服务器瓶颈
- **🛡️ 网安工具箱** — 工业级实用工具（随机密码/UUID/PIN、二维码转化、IP 态势感知、JSON 智能修复、WebSocket 实时调试）
- **💬 Matrix 终端** — 去中心化、端到端加密的实时通讯节点，深度集成至服务矩阵
- **🌐 HUD 服务矩阵** — 45+ 运维工具，12 个分类，Spotlight 全局搜索（`Cmd+K`）
- **🧠 运维智能节点** — [kb.opskitpro.com](https://kb.opskitpro.com)，基于 Quartz + Obsidian 的知识图谱
- **🌏 国际化** — Cookie 驱动的中英双语切换，自动检测浏览器语言

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **框架** | [Next.js 16](https://nextjs.org/) (Turbopack + App Router) |
| **适配器** | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| **运行时** | [Cloudflare Workers](https://workers.cloudflare.com/) (Node.js compat) |
| **样式** | [Tailwind CSS v4](https://tailwindcss.com/) + PostCSS |
| **图标** | [Lucide React](https://lucide.dev/) |
| **字体** | Inter, Noto Sans SC, JetBrains Mono |

---

## 💻 开发

### 环境要求

- **Node.js** >= 20
- **npm** >= 10

### 初始化

```bash
# 克隆仓库
git clone https://github.com/will-opz/opskitpro.git
cd opskitpro

# 安装依赖
npm install
```

### 启动开发服务器

```bash
# 标准开发模式（nodemon 监听配置变化，自动重启）
npm run dev

# 纯 HMR 模式（更快的热更新，不监听配置文件）
npm run dev:hmr
```

开发服务器启动后访问 `http://localhost:3000`。

`dev` 使用 nodemon 在 `src/`、`package.json`、`next.config.ts` 变化时重启；`dev:hmr` 使用 Next.js 原生 HMR，适合纯组件开发。

### Cloudflare 绑定

本地开发中可通过 `next.config.ts` 里的 `initOpenNextCloudflareForDev()` 访问 Cloudflare 上下文（如 `getCloudflareContext()`）。本地环境变量存放在 `.dev.vars`（已 gitignore）。

---

## 🔍 调试

### 本地 Workers 预览

在真实的 Cloudflare Workers 运行环境中本地测试：

```bash
npm run preview
```

会先构建 Next.js 应用，再在本地 Workers 模拟器中运行。适合排查仅在 Workers 运行时才出现的问题。

### 生产日志

实时查看已部署 Worker 的日志：

```bash
# 结构化 JSON 输出
npx wrangler tail --format json

# 可读格式
npx wrangler tail --format pretty
```

### 类型生成

根据 `wrangler.jsonc` 中定义的 Cloudflare 绑定生成 TypeScript 类型：

```bash
npm run cf-typegen
```

---

## 📦 部署

### 部署到生产环境

```bash
npm run deploy
```

该命令执行 `opennextjs-cloudflare build && opennextjs-cloudflare deploy`，流程如下：

1. 构建 Next.js 应用
2. 通过 OpenNext 打包为 Cloudflare Worker（入口 ~2 KB + 静态资源）
3. 上传资源并部署 Worker 到 Cloudflare 全球边缘网络

### 仅上传（不激活路由）

```bash
npm run upload
```

### Worker 配置

配置文件 [`wrangler.jsonc`](./wrangler.jsonc)：

| 配置项 | 值 |
|--------|-----|
| Worker 名称 | `opskitpro-org` |
| 自定义域名 | `opskitpro.com`, `www.opskitpro.com`, `deops.org`, `www.deops.org` |
| 兼容性标志 | `nodejs_compat`, `global_fetch_strictly_public` |
| 兼容日期 | `2024-12-30` |

OpenNext 适配器配置：[`open-next.config.ts`](./open-next.config.ts)

### 子站 `kb.opskitpro.com` (Cloudflare Pages)

| 配置项 | 值 |
|--------|-----|
| 仓库 | `will-opz/kb.opskitpro.com` |
| 构建命令 | `npx quartz build` |
| 输出目录 | `public` |

---

## 📁 项目结构

```
.
├── src/
│   ├── app/                  # Next.js App Router 页面
│   │   ├── api/ip/           # IP 地理定位 API
│   │   ├── about/            # 关于页面
│   │   ├── blog/             # 博客页面
│   │   ├── services/         # 服务矩阵页面
│   │   └── tools/            # 网安工具（passgen, qrgen, ip, json, websocket）
│   ├── components/           # 共享 React 组件
│   ├── dictionaries/         # i18n 翻译文件（zh.json, en.json）
│   └── proxy.ts              # 语言检测与路由代理
├── public/                   # 静态资源
├── next.config.ts            # Next.js + OpenNext 开发配置
├── open-next.config.ts       # OpenNext 适配器配置
├── wrangler.jsonc            # Cloudflare Worker 配置
├── tailwind.config.ts        # Tailwind CSS 配置
├── package.json
└── README.md
```

---

## 🤝 参与贡献

欢迎 SRE 和 DevOps 社区的贡献。无论是添加新工具还是优化 HUD 布局，欢迎提交 PR。

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 开源协议

本项目采用 **MIT License**。详见 `LICENSE` 文件。

---

<p align="center">
  <b>深度. 定义. 去中心化.</b><br/>
  Designed by <a href="https://opskitpro.com">OpsKitPro.com</a>
</p>
