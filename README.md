# OpsKitPro (Ops + Kit + Professional) — Industrial-Grade SRE Forensic Toolchain

[English](./README.md) | [简体中文](./README_zh.md)

**OpsKitPro** is a minimalist, hardcore, and data-driven operations infrastructure built for SREs and Network Engineers. Designed for real-time forensics and high-precision diagnostics, it is optimized for the **Cloudflare Edge Runtime** to achieve near-zero latency worldwide.

> [!IMPORTANT]
> This project runs on **Cloudflare Workers** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). The entire forensic engine is deployed on the edge, ensuring accurate global reachability testing.

---

## 🏛️ Core Forensic Suite

1.  **🔍 Website Check (`/tools/website-check`)**
    *   **Forensics**: Deep SSL/TLS audit, CDN edge detection (Cloudflare, Akamai, etc.), and health scoring.
    *   **Intelligence**: Automated mitigation suggestions for 502/SSL errors.
2.  **🌍 IP Lookup (`/tools/ip-lookup`)**
    *   **Forensics**: BGP Autonomous System (ASN) sensing, Proxy/VPN detection, and geolocation matrix.
    *   **Visualization**: Real-time HUD Radar Scanner for geographic targeting.
3.  **📡 DNS Lookup (`/tools/dns-lookup`)**
    *   **Forensics**: Multi-node (Cloudflare/Google) DOH resolution comparison.
    *   **Auditing**: Full RDATA manifest support for A, MX, CNAME, TXT, and CAA records.

---

## 🏗️ Architecture

```
opskitpro.com (Main Site — Next.js 14 on Cloudflare Workers)
├── /              Home — Hero + Forensic HUD
├── /services      Service Matrix (45+ tools, 12 categories)
├── /tools/        Forensic Suite (Website, IP, DNS)
├── /blog          Technical Notes (SRE Intel & Tutorials)
└── /api/          Edge Forensic API (Diagnostic & IP)

kb.opskitpro.com (Knowledge Node — Quartz + Obsidian)
└── Digital Garden (SRE patterns, knowledge graph, docs)
```

---

## 🧭 What’s in the site today

- **Home**: multilingual landing page with a centered search action and quick entry into diagnostics.
- **Services**: standardized tool matrix with one consistent card system, except for Matrix which keeps an independent identity.
- **Tools**: website-check, IP lookup, DNS lookup, JSON, WebSocket, QR code, and password generation modules.
- **Blog**: lightweight index cards on the main site; the full long-form notes live in KB and are linked out from here.
- **About**: a condensed project overview focused on operational design, readability, and the product direction.

---

## ✍️ Blog Series

The blog now acts as a lightweight index. The full long-form articles live in the KB site, while the main site keeps only summaries, entry points, and thin relay pages:

1. [Why I built OpsKitPro: from troubleshooting pain points to a tool platform](https://kb.opskitpro.com/02_Articles/opskitpro-requirements)
2. [OpsKitPro design principles: why the UI became more restrained](https://kb.opskitpro.com/02_Articles/opskitpro-design-principles)
3. [How the website-check module works: a breakdown of the implementation](https://kb.opskitpro.com/02_Articles/website-check-parallel-probes)
4. [IP lookup: returning structured fallback data instead of hard failure](https://kb.opskitpro.com/02_Articles/ip-lookup-structured-fallback)
5. [DNS lookup: why multi-resolver cross-checking matters](https://kb.opskitpro.com/02_Articles/dns-lookup-multi-resolver)
6. [Service matrix standardization and the Cloudflare deployment path](https://kb.opskitpro.com/02_Articles/services-standardization)
7. [Why OpsKitPro runs on Cloudflare Workers](https://kb.opskitpro.com/02_Articles/cloudflare-workers-deployment)

> The KB articles are written Chinese-first. The main site keeps localized titles, summaries, and entry points only.

---

## 🚀 Technical Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router + standalone build) |
| **Adapter** | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| **Runtime** | [Cloudflare Workers](https://workers.cloudflare.com/) (Edge Runtime) |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) (Light/Premium UI) |
| **Icons** | [Lucide React](https://lucide.dev/) (SRE Optimized Icons) |
| **Knowledge Base** | [Quartz 4](https://quartz.jzhao.xyz/) (Obsidian Linked) |

---

## 💻 Development & Deployment

### Setup
```bash
git clone https://github.com/will-opz/opskitpro.git
cd opskitpro
npm install
npm run dev
```

### Deploy to Cloudflare
```bash
# Deploys both the main engine and edge assets
npm run deploy
```

---

## 📁 Content Engine (Obsidian)
All technical field notes and tool guides are managed via Obsidian in the `/kb` directory and synchronized to [kb.opskitpro.com](https://kb.opskitpro.com). 

---

## 📬 Contact / Intelligence
- **Twitter / X**: [@deopsai](https://x.com/deopsai)
- **Email**: [admin@opskitpro.com](mailto:admin@opskitpro.com)
- **Status**: [Operational Matrix](https://opskitpro.com/services)

---

<p align="center">
  <b>Deep. Define. Decentralized.</b><br/>
  Designed by <a href="https://opskitpro.com">OpsKitPro.com</a>
</p>
