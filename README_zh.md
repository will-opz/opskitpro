# OpsKitPro (Ops + Kit + Professional) — 工业级 SRE 运维排障取证工具链

[English](./README.md) | [简体中文](./README_zh.md)

**OpsKitPro** 是为 SRE 和网络工程师打造的极简、硬核、数据驱动的运维基础设施。专注于实时取证（Forensics）与高精度诊断，针对 **Cloudflare Edge Runtime** 进行了深度优化，实现全球近零延迟响应。

> [!IMPORTANT]
> 本项目通过 [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) 运行在 **Cloudflare Workers** 之上。整个探测引擎部署在边缘节点，确保全球可达性测试的真实性与准确性。

---

## 🏛️ 核心取证三剑客

1.  **🔍 网站诊断 (`/tools/website-check`)**
    *   **取证功能**：深度 SSL/TLS 审计、CDN 边缘探测（Cloudflare, Akamai 等）以及健康度评分。
    *   **智能分析**：针对 502/SSL 错误的自动化修复建议。
2.  **🌍 IP 取证 (`/tools/ip-lookup`)**
    *   **取证功能**：BGP 自治系统 (ASN) 感知、Proxy/VPN 检测、地理位置矩阵。
    *   **可视化**：实时 HUD 雷达扫描仪。
3.  **📡 DNS 查询 (`/tools/dns-lookup`)**
    *   **取证功能**：多节点 (Cloudflare/Google) DOH 解析结果对比。
    *   **审计支持**：全量 RDATA 导出，支持 A, MX, CNAME, TXT, CAA 等记录。

---

## 🏗️ 系统架构

```
opskitpro.com (主站 — Next.js 14 on Cloudflare Workers)
├── /              首页 — 英雄页面 + 排障 HUD
├── /services      服务矩阵 (45+ 工具, 12 个分类)
├── /tools/        取证套件 (网站, IP, DNS)
├── /blog          技术笔记 (SRE 实战与教程)
└── /api/          边缘取证 API (诊断与 IP 地理位置)
```

---

## 🧭 当前站点包含什么

- **首页**：多语言落地页，保留一个中心化的搜索动作，方便直接进入诊断。
- **服务矩阵**：普通工具统一为标准卡片，Matrix 保留独立识别风格。
- **工具页**：网站诊断、IP 查询、DNS 检测、JSON、WebSocket、二维码与密码生成。
- **博客**：主站保留精选文章索引与摘要，完整内容直接在同站文章页中阅读。
- **关于页**：更聚焦运维设计、阅读体验和产品方向的项目说明。

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

> 文章正文直接在主站中阅读，主站保留多语言标题、摘要和入口。

---

## 🚀 技术栈

| 层级 | 技术选型 |
|-------|-----------|
| **框架** | [Next.js 14](https://nextjs.org/) (App Router + standalone 构建) |
| **适配器** | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| **运行时** | [Cloudflare Workers](https://workers.cloudflare.com/) (Edge Runtime) |
| **样式** | [Tailwind CSS v3](https://tailwindcss.com/) (极简高级感设计) |
| **图标** | [Lucide React](https://lucide.dev/) (SRE 优化图标库) |
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

---

## 📁 知识库
本项目所有的技术笔记和工具指南都在 Obsidian 中维护，并发布到 [kb.opskitpro.com](https://kb.opskitpro.com)。

---

## 📬 联系与情报
- **推特 / X**: [@deopsai](https://x.com/deopsai)
- **邮箱**: [admin@opskitpro.com](mailto:admin@opskitpro.com)
- **状态**: [全服务状态监控矩阵](https://opskitpro.com/services)

---

<p align="center">
  <b>Deep. Define. Decentralized.</b><br/>
  Designed by <a href="https://opskitpro.com">OpsKitPro.com</a>
</p>
