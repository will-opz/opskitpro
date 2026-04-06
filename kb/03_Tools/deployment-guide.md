# Cloudflare Pages + Workers 零成本部署全攻略

本指南将指导你如何将 OpsKitPro 部署到 Cloudflare 平台，利用其全球边缘网络提供高性能的 SRE 诊断服务。

## 🥇 1. 准备工作

1.  **代码准备**：确保代码已推送到 GitHub/GitLab。
2.  **账号设置**：在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 注册并启用 Pages 和 Workers。

## 🥈 2. 部署 Cloudflare Pages (前端 + Next.js App)

OpsKitPro 使用的是 Next.js (App Router)，通过 `@cloudflare/next-on-pages` 可以完美适配。

### 步骤：
1.  进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
2.  选择你的仓库。
3.  **构建设置 (Build Settings)**：
    -   **Framework preset**: `Next.js`
    -   **Build command**: `npm run build`
    -   **Output directory**: `.vercel/output/static` (取决于配置，通常 CF 会自动识别)。
4.  **环境变量 (Environmental Variables)**：
    -   `NODE_VERSION`: `18` 或更高。

## 🥉 3. 边缘运行时配置 (Edge Runtime)

为了获得最佳的组件负载能力与 OpenNext 的 Bundling 稳定性，项目中所有的诊断 API 已使用默认的 Node.js 运行时（结合 Cloudflare 的 `nodejs_compat` 模式）。

### 关键优化：
- **Runtime 切换**：建议使用默认运行时，这在 OpenNext 1.15+ 环境中能显著减少构建阶段的资源追踪错误。
-   **DoH 查询**：API 内部使用 `https://cloudflare-dns.com/dns-query`，无需额外库支持。
-   **SSL 探测**：通过公共 API 或边缘 Node 模拟实现，避免了 Edge Runtime 对 `tls` 模块的限制。

## 🧩 4. 绑定自定义域名 (SEO 关键)

1.  在 Pages 项目的 **Custom domains** 选项卡中添加 `opskitpro.com`。
2.  Cloudflare 会自动处理 SSL 映射。

## 🧱 5. 持续集成 (CI/CD)

每次你向 GitHub 推送代码：
1.  Cloudflare Pages 会自动触发构建。
2.  边缘函数（API Routes）会同步更新。
3.  **Obsidian 同步**：你可以将 Obsidian 库作为 Git Submodule，或者直接将 `kb/` 目录源码纳入主库，实现“笔记即文章”的自动发布。

---

> 💡 **专家建议**：部署完成后，请在 Cloudflare 的 **Speed** 选项卡中开启 **Early Hints** 和 **Brotli** 压缩，以获得极致的加载速度。
