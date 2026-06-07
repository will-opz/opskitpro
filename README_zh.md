# OpsKitPro (Ops + Kit + Professional) — Cloudflare 与 DNS 诊断中枢

[English](./README.md) | [简体中文](./README_zh.md)

**OpsKitPro** 是一个面向 SRE、DevOps 工程师和站长的 **综合诊断中枢 (Diagnostics Hub)**。它已经从一个简单的工具箱，进化为了一套闭环的诊断引擎，能够快速发现、解释并解决边缘网络及 DNS 故障。

> [!IMPORTANT]
> 此公开仓库包含主站、诊断工具、百科文章以及 Cloudflare 部署配置。私有运营自动化脚本、数据分析报告以及内部控制台代码存放于独立的私有仓库：`opskitpro-ops`。

---

## 🔍 核心诊断链路

OpsKitPro 围绕着无缝排障漏斗进行设计：
1. **发现 (Discover)**：从 `Website Check` 起步，自动探测隐藏的 CDN/DNS 故障。
2. **解释 (Explain)**：遇到 522 Timeout 等报错时，智能引导至 `Cloudflare 错误百科` 提供深度排障分析。
3. **验证 (Verify)**：使用 `Cloudflare Trace` 分析边缘连接状态，或切换至 `DNS 安全审计` 评估 SPF/DMARC/CAA 健康度。
4. **导出 (Report)**：支持一键导出 Markdown 格式的完整诊断与审计报告。

---

## 核心工具矩阵

- **Website Check** (`/tools/website-check`)：支持 HTTP 状态、SSL/TLS、DNS 与 CDN 探底。发现异常时可自动弹出对应百科和审计入口。
- **DNS Lookup & 安全审计** (`/tools/dns-lookup`)：支持 A/CNAME/MX 解析，同时主动对域名的安全记录（SPF/DMARC/CAA）进行打分并支持 Markdown 导出。
- **Cloudflare Trace** (`/tools/cloudflare-trace`)：绕过本地缓存直接探测边缘节点路径（Colo、TLS 版本、SNI）。
- **Cloudflare 错误百科** (`/errors/*`)：结构化、SEO 友好的错误指南，详细讲解 522、1020 等常见报错及根因排查方案。
- **IP Lookup** (`/tools/ip-lookup`)：提供 IP 归属地与网络元数据。
- **JSON 与 WebSocket** (`/tools/json`、`/tools/websocket`)：JSON 格式化校验及 WebSocket 实时连接调试工具。
- **常用小工具**：密码生成、时间转换、编解码及提示词构建工具。

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
