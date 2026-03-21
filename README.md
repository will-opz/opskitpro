# deops (de + ops) — AI-Native Operations Infrastructure

[English](./README.md) | [简体中文](./README_zh.md)

**deops** is a minimalist, hardcore, and fully automated operations infrastructure built for the next generation of AI-native engineers. Designed from the perspective of a Senior SRE, it embodies a decentralized, code-defined philosophy with a high-end, terminal-inspired aesthetic.

> [!IMPORTANT]
> This project is optimized for the **Cloudflare Edge Runtime**. It uses a pure Edge Dynamic architecture to achieve near-zero latency for operational tools and service management.

---

## 🚀 Key Features

- **⚡ Edge-First Architecture**: Built on **Next.js 16 (Turbopack)** and optimized for **Cloudflare Pages**, bypassing traditional server bottlenecks.
- **🛡️ Cyber Toolbelt**: Industrial-grade native utilities including an entropy-focused **Password Generator**, real-time **Text-to-QR** matrix encoding, and **Ops IP Edge Sensing**.
- **🌐 HUD Service Matrix**: A centralized "Head-Up Display" mapping 40+ operational tools covering:
  - **Threat Intel & Recon** (Nmap, Shodan, VirusTotal)
  - **DNS & Diagnostics** (MXToolBox, DNSDumpster, SecurityTrails)
  - **Zero Trust & Tunnels** (Tailscale, JumpServer)
  - **Password Management & AI** (1Password, OpenClaw, Claude)
  - **IT Automation & IaC** (Ansible, Terraform)
- **🧠 Knowledge Base (Ready for Core)**: A pre-configured Markdown engine for high-density incident post-mortems and architecture design docs.
- **💎 Premium Aesthetic**: A sleek, minimal engineering theme with glassmorphism, Spotlight global search (Cmd+K), and smart sticky navigation.

---

## 🛠️ Tech Stack

- **Core**: [Next.js 16](https://nextjs.org/) (App Router & Server Components)
- **Runtime**: [Cloudflare Edge Runtime](https://workers.cloudflare.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + PostCSS
- **Icons**: [Lucide React](https://lucide.dev/)
- **i18n**: Pure Edge-side localization via a custom `proxy.ts` layer.

---

## 📦 Deployment (Cloudflare Pages)

This project is tailored for **Cloudflare Pages** using the legacy `@cloudflare/next-on-pages@1` plugin (to ensure maximum compatibility without complex adapters).

### 1. Build Command
```bash
npx @cloudflare/next-on-pages@1
```

### 2. Required Settings
- **Framework Preset**: None (Custom)
- **Build Output Directory**: `.vercel/output/static`
- **Compatibility Flags**: Add `nodejs_compat` to both Production and Preview.
- **Compatibility Date**: Set to at least `2024-11-18`.

---

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/will-opz/deops.org.git

# Install dependencies
npm install

# Launch Turbopack dev server
npm run dev
```

---

## 🤝 Contributing

We welcome contributions from the SRE and DevOps community. Whether it's adding a new cyber tool or optimizing the HUD layout, feel free to open a PR.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <b>Deep. Define. Decentralized.</b><br/>
  Designed by <a href="https://deops.org">deops.org</a>
</p>

