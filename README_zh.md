# OpsKitPro (Ops + Kit + Professional) — 轻量 SRE 运维诊断工具箱

[English](./README.md) | [简体中文](./README_zh.md)

**OpsKitPro** 是面向 SRE、DevOps 工程师和开发者的轻量在线诊断工具箱。它聚焦日常排障和事故响应中最常见的浏览器内检查：网站诊断、DNS/IP 查询、JSON/WebSocket 工具，以及从真实运维经验中整理出来的工程笔记。

> [!IMPORTANT]
> 这个 public 仓库只保留主站、工具代码、公开文章和 Cloudflare 部署流程。私有运营自动化、访问分析日报、发布脚本和内部 dashboard 已拆分到 private 仓库 `opskitpro-ops`。

---

## 核心工具

- **网站诊断** (`/tools/website-check`)：HTTP 状态、SSL/TLS、DNS、CDN、响应头、性能和安全头检查。
- **DNS 查询** (`/tools/dns-lookup`)：A / AAAA / CNAME / MX / NS / TXT / CAA，多 resolver 对比。
- **IP 查询** (`/tools/ip-lookup`)：IP 地理位置、网络信息和结构化兜底结果。
- **JSON 工具** (`/tools/json`)：格式化、修复、比较、Schema 校验、字段提取和 jq 风格查询。
- **WebSocket 测试** (`/tools/websocket`)：连接测试、消息历史、模板、Ping 监控和多会话管理。
- **实用工具**：二维码、密码生成、时间工具、编码工具和 Prompt Builder。

---

## 🏗️ 系统架构

```
opskitpro.com (主站 — Next.js 14 on Cloudflare Workers)
├── /              首页和快速诊断入口
├── /tools         工具箱索引
├── /tools/*       网站、DNS、IP、JSON、WebSocket 和实用工具
├── /blog          工程笔记与运维复盘
├── /services      常用外部服务矩阵
└── /api           边缘诊断 API
```

---

## 🧭 当前站点包含什么

- **首页**：多语言落地页，保留一个中心化的搜索动作，方便直接进入诊断。
- **工具页**：网站诊断、DNS 查询、IP 查询、JSON、WebSocket、二维码、密码生成、时间、编码和 Prompt Builder。
- **博客**：Cloudflare、排障、工具设计和运维经验相关的工程笔记。
- **服务矩阵**：面向 DevOps/SRE 常见工作流的外部服务入口。
- **关于页**：聚焦运维设计、可维护性和产品方向的项目说明。

---

## ✍️ 博客系列

主站现在以工具为主，文章为辅；文章内容直接在同站整理，便于统一维护与阅读：

1. [为什么我做 OpsKitPro：从排障痛点到工具平台](https://opskitpro.com/blog/why-opskitpro)
2. [OpsKitPro 的设计原则：为什么我把 UI 做得更克制](https://opskitpro.com/blog/design-principles)
3. [website-check 的实现拆解：为什么要做并行探测](https://opskitpro.com/blog/website-check-module)
4. [IP Lookup：为什么要返回结构化兜底结果](https://opskitpro.com/blog/ip-lookup)
5. [DNS Lookup：为什么要做多 resolver 交叉验证](https://opskitpro.com/blog/dns-lookup)
6. [服务矩阵标准化与 Cloudflare 部署路径](https://opskitpro.com/blog/services-deployment)
7. [OpsKitPro 为什么最终跑在 Cloudflare Workers 上](https://opskitpro.com/blog/cloudflare-workers-deployment)
8. [翻到 8 年前自己在 V2EX 的回复，发现当年我真低估了 Git](https://opskitpro.com/blog/underestimating-git)

> 文章正文直接在主站中阅读，主站保留多语言标题、摘要和入口。

---

## 🚀 技术栈

| 层级 | 技术选型 |
|-------|-----------|
| **框架** | [Next.js 14](https://nextjs.org/) (App Router + standalone 构建) |
| **适配器** | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| **运行时** | [Cloudflare Workers](https://workers.cloudflare.com/) (Edge Runtime) |
| **样式** | [Tailwind CSS v3](https://tailwindcss.com/) |
| **图标** | [Lucide React](https://lucide.dev/) |
| **测试** | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |
| **CI/CD** | GitHub Actions → Cloudflare Workers |
| **知识库** | [kb.opskitpro.com](https://kb.opskitpro.com)（Obsidian 编写，静态发布） |

---

## 💻 开发与部署

### 快速开始
```bash
git clone https://github.com/will-opz/opskitpro.git
cd opskitpro
npm install
npm run dev
```

### 部署至 Cloudflare
```bash
# 一键构建探测引擎并同步边缘资产
npm run deploy
```

仓库已经接入 GitHub Actions CI/CD：

- PR 到 `main`：安装依赖、测试、构建
- push 到 `main`：安装依赖、测试、构建并部署到 Cloudflare
- 需要配置的 GitHub Secrets：`CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`

运行时环境变量：

```bash
OPSKITPRO_ADMIN_PASSWORD=
OPSKITPRO_ADMIN_SECRET=
```

这些变量用于 `/tools` 导航页的单用户管理员登录。真实值请配置在 Cloudflare Worker 环境变量或 secret 中，不要提交到 Git。

---

## 仓库边界

这个 public 仓库只保留面向产品和社区的内容：

- 主站和工具代码
- 公开博客 / Qiita 文章草稿
- 测试与 CI/CD workflow
- 不含密钥的 Cloudflare Worker 配置

私有运营数据不放在这里。private 仓库 `opskitpro-ops` 包含：

- Cloudflare / X 数据分析自动化
- 每日运营报告和历史快照
- Qiita / X 发布辅助脚本
- 本地只读 Ops Dashboard
- 推广计划和私有 backlog 信号

---

## 📁 知识库
本项目所有的技术笔记和工具指南都在 Obsidian 中维护，并发布到 [kb.opskitpro.com](https://kb.opskitpro.com)。

---

## 📬 联系与情报
- **推特 / X**: [@OpsKitPro](https://x.com/OpsKitPro)
- **邮箱**: [admin@opskitpro.com](mailto:admin@opskitpro.com)
- **状态**: [全服务状态监控矩阵](https://opskitpro.com/services)

---

<p align="center">
  <b>Deep. Define. Decentralized.</b><br/>
  Designed by <a href="https://opskitpro.com">OpsKitPro.com</a>
</p>
